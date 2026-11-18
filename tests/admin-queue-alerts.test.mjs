import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { permissionMocks } from "./helpers/permission-mocks.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
function load(file, dependencies = {}, env = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    .replaceAll("import.meta.env", JSON.stringify(env));
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename: file })(
    (name) => dependencies[name] ?? require(name), module, module.exports,
  );
  return module.exports;
}
const config = load("src/config/admin-queue-alerts.config.ts");
const controllerFile = "src/features/admin-queue/queueController.ts";
const flush = async () => { for (let i = 0; i < 18; i++) await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture() {
  const production = load(controllerFile);
  let now = 0, visible = true, online = true, nextId = 0;
  const timers = new Map(), listeners = new Set();
  const env = {
    now: () => now,
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { at: now + delay, fn }); return id; },
    clearTimeout: (id) => timers.delete(id),
    isVisible: () => visible, isOnline: () => online,
    listen(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
  const requests = [], snapshots = [], popups = [];
  const make = () => production.createQueueController({
    env, pollIntervalMs: 30000, popupCooldownMs: 60000,
    fetchCounts(signal) { const d = deferred(); requests.push({ ...d, signal }); return d.promise; },
    onSnapshot: (value) => snapshots.push(value), onIncrease: (count) => popups.push(count),
  });
  const controller = make();
  async function advance(ms) {
    const until = now + ms;
    for (let steps = 0; steps < 100; steps++) {
      await flush();
      const earliest = [...timers].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!earliest) { now = until; await flush(); return; }
      now = earliest[1].at; timers.delete(earliest[0]); earliest[1].fn();
    }
    throw new Error("Timer storm");
  }
  async function success(n, index = requests.length - 1) {
    requests[index].resolve({ ALL: n, PENDING_REVIEW: n }); await flush();
  }
  const signal = (state = {}) => {
    if ("visible" in state) visible = state.visible;
    if ("online" in state) online = state.online;
    for (const fn of listeners) fn();
  };
  return { ...production, controller, make, advance, success, signal, requests, snapshots, popups, timers, listeners };
}

test("environment defaults, explicit disable, invalid flags and bounded intervals", () => {
  const parse = config.parseAdminQueueAlertsConfig;
  assert.deepEqual(parse({}), { enabled: true, pollIntervalMs: 30000, popupCooldownMs: 60000 });
  for (const flag of ["false", "TRUE", "yes", "0"]) assert.equal(parse({ VITE_ADMIN_QUEUE_ALERTS_ENABLED: flag }).enabled, false);
  assert.equal(parse({ VITE_ADMIN_QUEUE_ALERTS_ENABLED: " true " }).enabled, true);
  assert.deepEqual(parse({ VITE_ADMIN_QUEUE_POLL_INTERVAL_MS: "-1", VITE_ADMIN_QUEUE_POPUP_COOLDOWN_MS: "0" }),
    { enabled: true, pollIntervalMs: 10000, popupCooldownMs: 10000 });
  assert.equal(parse({ VITE_ADMIN_QUEUE_POLL_INTERVAL_MS: "1e20" }).pollIntervalMs, 300000);
  assert.equal(parse({ VITE_ADMIN_QUEUE_POPUP_COOLDOWN_MS: "1e20" }).popupCooldownMs, 3600000);
  for (const value of ["NaN", "Infinity", "not a number", ""]) {
    assert.equal(parse({ VITE_ADMIN_QUEUE_POLL_INTERVAL_MS: value }).pollIntervalMs, 30000);
  }
});

test("count parsing rejects malformed maps and inherited keys instead of inventing an empty queue", () => {
  const { readPendingCount, formatQueueBadge } = load(controllerFile);
  for (const payload of [null, [], "0", {}, { PENDING_REVIEW: 2 }, { ALL: -1 }, { ALL: 3, PENDING_REVIEW: 0.5 },
    { ALL: 3, PUBLISHED: NaN }, { ALL: Infinity }, { ALL: 3, PENDING_REVIEW: "2" },
    Object.assign(Object.create({ ALL: 3 }), { PENDING_REVIEW: 2 })]) assert.equal(readPendingCount(payload), null);
  assert.equal(readPendingCount({ ALL: 5 }), 0);
  assert.equal(readPendingCount(Object.assign(Object.create(null), { ALL: 5, PENDING_REVIEW: 2 })), 2);
  assert.equal(formatQueueBadge(1200), "99+"); assert.equal(formatQueueBadge(4), "4");
});

test("initial backlog is silent; poll delay begins after settlement and increases create one summary", async () => {
  const f = fixture(); f.controller.start(); await f.advance(0);
  assert.equal(f.requests.length, 1);
  await f.advance(90000); assert.equal(f.requests.length, 1);
  await f.success(200); assert.deepEqual(f.popups, []);
  await f.advance(29999); assert.equal(f.requests.length, 1);
  await f.advance(1); await f.success(205);
  assert.deepEqual(f.popups, [205]);
  assert.deepEqual(f.snapshots.at(-1), { count: 205, status: "ready" });
  f.controller.destroy(); assert.equal(f.timers.size, 0); assert.equal(f.listeners.size, 0);
});

test("cooldown groups increases to latest count and cancellation follows a queue decrease", async () => {
  const f = fixture(); f.controller.start(); await f.advance(0); await f.success(1);
  await f.advance(30000); await f.success(2); assert.deepEqual(f.popups, [2]);
  await f.advance(30000); await f.success(4); assert.deepEqual(f.popups, [2]);
  await f.advance(30000); await f.success(5); assert.deepEqual(f.popups, [2, 5]);
  await f.advance(30000); await f.success(6);
  await f.advance(30000); await f.success(1); assert.deepEqual(f.popups, [2, 5]);
  f.controller.destroy();
});

test("local moderation mutes a running response and coalesces many invalidations to one follow-up", async () => {
  const f = fixture(); f.controller.start(); await f.advance(0); await f.success(1);
  await f.advance(30000);
  for (let i = 0; i < 50; i++) f.controller.refresh();
  await f.advance(5000); assert.equal(f.requests.length, 2);
  await f.success(10); assert.deepEqual(f.popups, []);
  await f.advance(0); assert.equal(f.requests.length, 3);
  await f.success(11); assert.deepEqual(f.popups, []);
  f.controller.destroy();
});

test("hidden/offline abort old work, and resuming waits for actual old settlement", async () => {
  const f = fixture(); f.controller.start(); await f.advance(0);
  f.signal({ visible: false }); assert.equal(f.requests[0].signal.aborted, true);
  await f.advance(60000); assert.equal(f.requests.length, 1);
  f.signal({ visible: true }); await f.advance(0);
  assert.equal(f.requests.length, 1, "do not overlap a fetch that ignored abort");
  await f.success(999, 0); await flush(); assert.equal(f.requests.length, 2);
  await f.success(3); assert.deepEqual(f.popups, []);
  assert.deepEqual(f.snapshots.at(-1), { count: 3, status: "ready" });
  f.signal({ online: false }); await f.advance(60000); assert.equal(f.requests.length, 2);
  f.signal({ online: true }); await f.advance(0); await f.success(20);
  assert.deepEqual(f.popups, [], "offline recovery re-baselines without a popup flood");
  f.controller.destroy();
});

test("focus storms are bounded and 401/403 lock out further requests", async () => {
  for (const code of [401, 403]) {
    const f = fixture(); f.controller.start(); await f.advance(0); await f.success(7);
    for (let i = 0; i < 20; i++) f.signal();
    await f.advance(9999); assert.equal(f.requests.length, 1);
    await f.advance(1); assert.equal(f.requests.length, 2);
    f.requests[1].reject({ response: { status: code } }); await flush();
    assert.deepEqual(f.snapshots.at(-1), { count: null, status: "forbidden" });
    f.controller.refresh(); f.signal(); await f.advance(3600000);
    assert.equal(f.requests.length, 2); f.controller.destroy();
  }
});

test("network/malformed failures retain last valid count, back off, then silently recover", async () => {
  const f = fixture(); f.controller.start(); await f.advance(0); await f.success(7);
  await f.advance(30000); f.requests[1].resolve(null); await flush();
  assert.deepEqual(f.snapshots.at(-1), { count: 7, status: "stale" });
  await f.advance(59999); assert.equal(f.requests.length, 2);
  await f.advance(1); f.requests[2].reject(new Error("offline")); await flush();
  await f.advance(120000); await f.success(80);
  assert.deepEqual(f.popups, []); assert.equal(f.snapshots.at(-1).count, 80);
  f.controller.destroy();
});

test("destroy and StrictMode replacement serialize pending work and discard old identity results", async () => {
  const f = fixture(); f.controller.start(); await f.advance(0);
  f.controller.destroy(); const replacement = f.make(); replacement.start(); await f.advance(0);
  assert.equal(f.requests.length, 1);
  await f.success(999, 0); assert.equal(f.requests.length, 2);
  assert.deepEqual(f.snapshots, []); await f.success(2);
  assert.deepEqual(f.snapshots, [{ count: 2, status: "ready" }]);
  replacement.destroy(); await f.advance(300000); assert.equal(f.requests.length, 2);
});

test("service invalidates only after successful decisions and subscriber errors never fail CRUD", async () => {
  let fail = false, seen = 0, requestSignal;
  const api = {
    async get(_path, options) { requestSignal = options.signal; return { data: { result: { ALL: 3 } } }; },
    async patch() { if (fail) throw new Error("denied"); return { data: { result: { id: "listing" } } }; },
  };
  const service = load("src/services/admin-listing.service.ts", { "@/lib/axios-client": { __esModule: true, default: api } }).adminListingService;
  const off = service.onModerationChange(() => seen++);
  const badOff = service.onModerationChange(() => { throw new Error("listener failed"); });
  const signal = new AbortController().signal; await service.getStatusCounts(signal); assert.equal(requestSignal, signal);
  const warn = console.warn; console.warn = () => {};
  try {
    assert.deepEqual(await service.changeStatus("listing", "HIDDEN", "reason"), { id: "listing" });
    await service.decideEdit("listing", "edit", true, ""); assert.equal(seen, 2);
    fail = true; await assert.rejects(service.decideEdit("listing", "edit", false, "reason")); assert.equal(seen, 2);
    off(); badOff(); fail = false; await service.changeStatus("listing", "HIDDEN", "reason"); assert.equal(seen, 2);
  } finally { console.warn = warn; off(); badOff(); }
});

test("real React provider scopes counts to verified identity and bell navigation does not clear the queue", async () => {
  const { JSDOM } = require("jsdom"), React = require("react");
  const { createRoot } = require("react-dom/client");
  const { MemoryRouter } = require("react-router-dom");
  const dom = new JSDOM("<!doctype html><body><div id='root'></div></body>", { url: "http://localhost:5000/dashboard" });
  const globals = ["window", "document", "navigator", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
  const old = new Map(globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of globals) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[key] });
  const context = load("src/features/admin-queue/adminQueueContext.ts");
  const controllers = [], toasts = [];
  let granted = ["LISTING_VIEW"];
  let auth = { initialized: true, authenticated: true, userId: "A", roles: [] };
  let user = { status: "succeeded", loadedForUserId: "A", profile: { id: "A", role: "ADMIN" } };
  const queueModule = {
    ...load(controllerFile),
    createQueueController(opts) { const c = { opts, destroyed: false, start() {}, refresh() {}, destroy() { this.destroyed = true; } }; controllers.push(c); return c; },
  };
  const { AdminQueueProvider } = load("src/features/admin-queue/AdminQueueProvider.tsx", {
    ...permissionMocks(() => granted),
    "@/config/admin-queue-alerts.config": config,
    "@/services/admin-listing.service": { adminListingService: { getStatusCounts() {}, onModerationChange: () => () => {} } },
    "@/store/hooks": { useAppSelector: (selector) => selector({ auth, user }) }, "./adminQueueContext": context,
    "./adminAccess": load("src/features/admin-queue/adminAccess.ts"),
    "./queueController": queueModule, sonner: { toast: { info: (...args) => toasts.push(args), dismiss() {} } },
  });
  const Bell = load("src/layouts/AdminQueueBell.tsx", {
    "@/features/admin-queue/adminQueueContext": context,
    "@/features/admin-queue/queueController": queueModule,
    "@/features/admin-queue/usePendingListingRequests": { usePendingListingRequests: () => ({ items: [], status: "ready" }) },
    "@/features/admin-queue/PendingListingItem": { __esModule: true, default: () => null },
    "@/features/admin-queue/pendingListing": load("src/features/admin-queue/pendingListing.ts"),
  }).default;
  const root = createRoot(document.getElementById("root"));
  const render = () => root.render(React.createElement(MemoryRouter, null,
    React.createElement(AdminQueueProvider, null, React.createElement(Bell))));
  try {
    await React.act(async () => render()); assert.equal(controllers.length, 1);
    await React.act(async () => controllers[0].opts.onSnapshot({ count: 1200, status: "ready" }));
    const button = document.querySelector("button"); assert.match(button.getAttribute("aria-label"), /1200/);
    assert.equal(button.textContent, "99+");
    await React.act(async () => button.click());
    assert.equal(document.querySelector("a").getAttribute("href"), "/notifications");
    assert.match(document.querySelector("[role=status]").textContent, /1200/);
    await React.act(async () => document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(document.querySelector("[role=dialog]"), null); assert.equal(button.textContent, "99+");
    await React.act(async () => button.click());
    await React.act(async () => document.body.dispatchEvent(new dom.window.MouseEvent("mousedown", { bubbles: true })));
    assert.equal(document.querySelector("[role=dialog]"), null);
    auth = { ...auth, userId: "B" };
    user = { status: "succeeded", loadedForUserId: "B", profile: { id: "B", role: "ADMIN" } };
    await React.act(async () => render());
    assert.equal(controllers[0].destroyed, true); assert.doesNotMatch(document.body.textContent, /1200|99\+/);
    await React.act(async () => controllers[1].opts.onSnapshot({ count: 2, status: "stale" }));
    await React.act(async () => document.querySelector("button").click());
    assert.match(document.body.textContent, /có thể đã cũ/);
    auth = { ...auth, roles: ["ADMIN"] };
    user = { ...user, profile: { id: "B", role: "USER" } };
    await React.act(async () => render());
    assert.equal(controllers[1].destroyed, true); assert.equal(controllers.length, 2);
    assert.doesNotMatch(document.body.textContent, /Hiện có 2/); assert.deepEqual(toasts, []);
    // An ADMIN without LISTING_VIEW must not start the /admin/listings poller; granting it later does.
    user = { ...user, profile: { id: "B", role: "ADMIN" } }; granted = [];
    await React.act(async () => render()); assert.equal(controllers.length, 2);
    granted = ["LISTING_VIEW"];
    await React.act(async () => render()); assert.equal(controllers.length, 3);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, desc] of old) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; }
  }
});
