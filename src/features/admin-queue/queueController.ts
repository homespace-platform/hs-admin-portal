/**
 * Framework-free poller for the ADMIN PENDING_REVIEW aggregate count.
 *
 * Invariants:
 * - At most one request in flight; the next poll timer is armed only AFTER a request settles
 *   (never an interval), and at most one timer exists.
 * - Hidden/offline: timer cleared and in-flight request aborted; resume (focus/visibility/online)
 *   refreshes, but not more often than RESUME_MIN_GAP_MS.
 * - Results of aborted/destroyed/superseded requests are ignored (generation token).
 * - 401/403 stops polling for the life of this controller (a new one is built on identity change).
 * - Errors/malformed payloads never become 0: last valid count is kept and flagged "stale".
 *
 * Limitation: this is an aggregate COUNT. An arrival offset by a completion between two polls is
 * invisible, and a popup states the current queue size, not the number of new requests.
 */
export type QueueStatus = "loading" | "ready" | "stale" | "error" | "forbidden";

export interface QueueSnapshot {
  count: number | null;
  status: QueueStatus;
}

export interface QueueEnv {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  isVisible(): boolean;
  isOnline(): boolean;
  /** Calls `handler` on focus/visibilitychange/online/offline; returns an unsubscribe. */
  listen(handler: () => void): () => void;
}

export interface QueueControllerOptions {
  fetchCounts(signal: AbortSignal): Promise<unknown>;
  pollIntervalMs: number;
  popupCooldownMs: number;
  onSnapshot(snapshot: QueueSnapshot): void;
  /** Called with the current pending count when an aggregate popup is due. */
  onIncrease(count: number): void;
  env?: QueueEnv;
}

export interface QueueController {
  start(): void;
  /** Prompt refresh after this admin's own moderation write; never toasts. */
  refresh(): void;
  destroy(): void;
}

const RESUME_MIN_GAP_MS = 10_000;
const LOCAL_MIN_GAP_MS = 1_000;
const BACKOFF_CAP_MS = 300_000;

export const formatQueueBadge = (count: number) => (count > 99 ? "99+" : String(count));

const validCount = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;
const hasOwn = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Pure: PENDING_REVIEW count from the /counts payload, or null when malformed.
 * The payload must be a plain map whose values are ALL non-negative integers. The backend omits
 * statuses with no rows but always sends its own `ALL` total, so a missing own PENDING_REVIEW key
 * means 0 only when `ALL` is present and the whole map is valid.
 */
export function readPendingCount(payload: unknown): number | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const proto = Object.getPrototypeOf(payload);
  if (proto !== Object.prototype && proto !== null) return null;
  const counts = payload as Record<string, unknown>;
  if (!Object.values(counts).every(validCount) || !hasOwn(counts, "ALL")) return null;
  return hasOwn(counts, "PENDING_REVIEW") ? (counts.PENDING_REVIEW as number) : 0;
}

// Shared across controllers (StrictMode replaces a provider's controller): a new fetch waits for the
// previous one to actually settle, so two count requests are never active at once.
let requestTail: Promise<void> = Promise.resolve();

const isAbort = (e: unknown) =>
  typeof e === "object" && e !== null && ["AbortError", "CanceledError"].includes((e as { name?: string }).name ?? "");
const httpStatus = (e: unknown) =>
  (e as { response?: { status?: number } } | null)?.response?.status;

export function browserQueueEnv(): QueueEnv {
  return {
    now: () => Date.now(),
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (h) => globalThis.clearTimeout(h as number),
    isVisible: () => document.visibilityState !== "hidden",
    isOnline: () => navigator.onLine !== false,
    listen: (handler) => {
      document.addEventListener("visibilitychange", handler);
      window.addEventListener("focus", handler);
      window.addEventListener("online", handler);
      window.addEventListener("offline", handler);
      return () => {
        document.removeEventListener("visibilitychange", handler);
        window.removeEventListener("focus", handler);
        window.removeEventListener("online", handler);
        window.removeEventListener("offline", handler);
      };
    },
  };
}

export function createQueueController(opts: QueueControllerOptions): QueueController {
  const env = opts.env ?? browserQueueEnv();
  const cap = Math.max(opts.pollIntervalMs, BACKOFF_CAP_MS);

  let destroyed = false;
  let blocked = false; // 401/403
  let inFlight = false;
  let gen = 0;
  let abort: AbortController | null = null;
  let timer: unknown = null;
  let timerDue = 0;
  let lastStart = -Infinity;
  let followUpGap: number | null = null;
  let localPending = false; // own moderation write seen: next request is silent
  let inFlightSilent = false; // ...and so is a request already running when it happened
  let baselineNeeded = false; // after failures/offline, the first success re-baselines silently
  let failures = 0;
  let unlisten: (() => void) | null = null;

  let count: number | null = null;
  let status: QueueStatus = "loading";
  let published = "loading:null";

  // Popup bookkeeping
  let floor = 0; // lowest count since the last popup/baseline: popup only while count > floor
  let owed = false;
  let lastToastAt = -Infinity;

  const emit = () => {
    const key = `${status}:${count}`;
    if (destroyed || key === published) return;
    published = key;
    opts.onSnapshot({ count, status });
  };
  const canRun = () => !destroyed && !blocked && env.isVisible() && env.isOnline();
  const clearTimer = () => {
    if (timer !== null) env.clearTimeout(timer);
    timer = null;
  };
  const cancelInFlight = () => {
    gen++;
    abort?.abort();
    abort = null;
    inFlight = false;
    followUpGap = null;
  };
  const schedule = (delay: number) => {
    clearTimer();
    if (!canRun()) return;
    timerDue = env.now() + delay;
    timer = env.setTimeout(() => {
      timer = null;
      void request();
    }, delay);
  };
  /** Refresh no sooner than `gap` after the last request start; never later than an already-armed timer. */
  const soon = (gap: number) => {
    if (!canRun()) return;
    if (inFlight) {
      followUpGap = Math.min(followUpGap ?? gap, gap);
      return;
    }
    const delay = Math.max(0, lastStart + gap - env.now());
    if (timer !== null && timerDue <= env.now() + delay) return;
    schedule(delay);
  };

  const onSuccess = (next: number, silent: boolean) => {
    const prev = count;
    count = next;
    status = "ready";
    failures = 0;
    if (prev === null || baselineNeeded) {
      baselineNeeded = false;
      floor = next; // first success (ever / after failures): silent baseline
      owed = false;
      return;
    }
    if (next < floor) floor = next;
    if (silent) {
      floor = next;
      owed = false;
      return;
    }
    if (next > prev) owed = true;
    if (next <= floor) owed = false;
    if (owed && env.now() - lastToastAt >= opts.popupCooldownMs) {
      lastToastAt = env.now();
      owed = false;
      floor = next;
      opts.onIncrease(next);
    }
  };

  const request = async () => {
    if (!canRun() || inFlight) return;
    inFlight = true;
    lastStart = env.now();
    inFlightSilent = localPending;
    localPending = false;
    const myGen = ++gen;
    const controller = new AbortController();
    abort = controller;
    let delay = opts.pollIntervalMs;
    const prior = requestTail;
    let release!: () => void;
    requestTail = new Promise<void>((resolve) => (release = resolve));
    try {
      await prior; // never rejects; resolves only once the previous fetch has settled
      if (myGen !== gen || destroyed) return;
      const next = readPendingCount(await opts.fetchCounts(controller.signal));
      if (myGen !== gen || destroyed) return;
      if (next === null) throw new Error("Malformed queue counts payload");
      onSuccess(next, inFlightSilent);
    } catch (e) {
      if (myGen !== gen || destroyed || isAbort(e)) return;
      const code = httpStatus(e);
      if (code === 401 || code === 403) {
        blocked = true;
        count = null;
        status = "forbidden";
        inFlight = false;
        emit();
        return;
      }
      failures++;
      baselineNeeded = true;
      status = count !== null ? "stale" : "error";
      delay = Math.min(cap, opts.pollIntervalMs * 2 ** Math.min(failures, 5));
    } finally {
      release();
    }
    inFlight = false;
    emit();
    const gap = followUpGap;
    followUpGap = null;
    schedule(gap === null ? delay : Math.max(0, lastStart + gap - env.now()));
  };

  const sync = () => {
    if (destroyed || blocked) return;
    if (!canRun()) {
      clearTimer();
      cancelInFlight();
      if (!env.isOnline()) {
        baselineNeeded = true;
        status = count !== null ? "stale" : "error";
        emit();
      }
      return;
    }
    soon(RESUME_MIN_GAP_MS);
  };

  return {
    start() {
      if (destroyed || unlisten) return;
      unlisten = env.listen(sync);
      if (canRun()) schedule(0);
    },
    refresh() {
      if (destroyed || blocked) return;
      localPending = true;
      inFlightSilent = true; // a response racing this write must not raise a popup either
      soon(LOCAL_MIN_GAP_MS);
    },
    destroy() {
      destroyed = true;
      clearTimer();
      cancelInFlight();
      unlisten?.();
      unlisten = null;
    },
  };
}
