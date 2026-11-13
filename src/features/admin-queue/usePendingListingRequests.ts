import { useCallback, useEffect, useState } from "react";
import { adminListingService } from "@/services/admin-listing.service";
import type { AdminListingSummaryResponse } from "@/types/listing.type";

const REQUEST_TIMEOUT_MS = 15_000;

export type PendingRequestsStatus = "loading" | "ready" | "error" | "forbidden";

interface Options {
  /** Verified-admin identity from useAdminQueue().owner; null => no fetch, no rows. */
  owner: string | null;
  /** Fetch only while true (e.g. the bell is open). */
  enabled: boolean;
  page: number;
  size: number;
  keyword?: string;
  /** useAdminQueue().version: refetch the same query when the shared count updates/recovers. */
  version: number;
}

interface Held {
  key: string;
  items: AdminListingSummaryResponse[];
  totalElements: number;
  totalPages: number;
  status: Exclude<PendingRequestsStatus, "loading">;
}

const httpStatus = (e: unknown) => (e as { response?: { status?: number } } | null)?.response?.status;
const isAbort = (e: unknown) =>
  typeof e === "object" && e !== null && ["AbortError", "CanceledError"].includes((e as { name?: string }).name ?? "");

/**
 * Detail reads for the pending queue (real PENDING_REVIEW rows, new listings and pending edits).
 * No timers: it runs on query change, shared `version` change, successful local moderation and `reload()`.
 * Rows of another owner/query are hidden in the same render (key mismatch); stale responses are
 * aborted and also sequence-guarded.
 */
export function usePendingListingRequests({ owner, enabled, page, size, keyword = "", version }: Options) {
  const kw = keyword.trim();
  const key = `${owner}|${page}|${size}|${kw}`;
  const [held, setHeld] = useState<Held | null>(null);
  const [tick, setTick] = useState(0);
  const run = enabled && owner !== null;

  useEffect(() => {
    if (!run) return;
    const controller = new AbortController();
    let stale = false;
    adminListingService
      .findAll(
        { status: "PENDING_REVIEW", page, size, sort: "submittedAt,desc", ...(kw ? { keyword: kw } : {}) },
        controller.signal,
        REQUEST_TIMEOUT_MS,
      )
      .then((res) => {
        if (stale) return;
        if (!res || !Array.isArray(res.result)) throw new Error("Malformed pending listing page");
        setHeld({
          key,
          items: res.result,
          totalElements: Number.isFinite(res.totalElements) ? res.totalElements : res.result.length,
          totalPages: Number.isFinite(res.totalPages) ? Math.max(res.totalPages, 0) : 1,
          status: "ready",
        });
      })
      .catch((e: unknown) => {
        if (stale || isAbort(e)) return;
        const code = httpStatus(e);
        setHeld({ key, items: [], totalElements: 0, totalPages: 0, status: code === 401 || code === 403 ? "forbidden" : "error" });
      });
    return () => {
      stale = true;
      controller.abort();
    };
  }, [run, key, page, size, kw, version, tick]);

  // Moderation by this admin: refetch the open query (the shared poller refreshes the count itself).
  useEffect(() => {
    if (!run) return;
    return adminListingService.onModerationChange(() => setTick((t) => t + 1));
  }, [run]);

  const reload = useCallback(() => {
    setHeld((h) => (h?.status === "ready" ? h : null)); // errors go back to loading; ready rows stay while refreshing
    setTick((t) => t + 1);
  }, []);

  const mine = run && held?.key === key ? held : null;
  return {
    items: mine?.items ?? [],
    totalElements: mine?.totalElements ?? 0,
    totalPages: mine?.totalPages ?? 0,
    status: (mine?.status ?? "loading") as PendingRequestsStatus,
    reload,
  };
}
