import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript"), React = require("react");
function load(file, dependencies = {}, timers = globalThis) {
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports,setTimeout,clearTimeout){${output}\n})`, { filename: file })(
    (name) => dependencies[name] ?? require(name), module, module.exports, timers.setTimeout, timers.clearTimeout,
  );
  return module.exports;
}
const access = load("src/features/admin-queue/adminAccess.ts");
const helpers = load("src/features/admin-queue/pendingListing.ts");
const readyAuth = { initialized: true, authenticated: true, userId: "admin-A", roles: [] };
const readyUser = { status: "succeeded", loadedForUserId: "admin-A", profile: { id: "admin-A", role: "ADMIN" } };

test("backend ADMIN without token realm roles is available; stale or wrong profiles never grant access", () => {
  const resolve = access.resolveAdminAccess;
  assert.deepEqual(resolve(readyAuth, readyUser), { access: "ready", userId: "admin-A" });
  assert.equal(resolve(readyAuth, { ...readyUser, profile: { ...readyUser.profile, role: " admin " } }).access, "ready");
  assert.equal(resolve({ ...readyAuth, roles: ["ADMIN"] }, { ...readyUser, profile: { id: "admin-A", role: "USER" } }).access, "forbidden");
  assert.equal(resolve(readyAuth, { ...readyUser, loadedForUserId: "admin-B" }).access, "loading");
  assert.equal(resolve(readyAuth, { ...readyUser, profile: { id: "admin-B", role: "ADMIN" } }).access, "forbidden");
  assert.equal(resolve(readyAuth, { ...readyUser, profile: null }).access, "forbidden");
  for (const status of ["idle", "loading", "failed"]) {
    assert.equal(resolve(readyAuth, { ...readyUser, status }).access, status === "failed" ? "profile-error" : "loading");
  }
  assert.equal(resolve({ ...readyAuth, initialized: false }, readyUser).access, "loading");
  assert.equal(resolve({ ...readyAuth, authenticated: false }, readyUser).access, "signed-out");
  assert.equal(resolve({ ...readyAuth, userId: null }, readyUser).access, "signed-out");
});

test("work items distinguish edits, encode detail IDs and explain access states without fake unread actions", () => {
  assert.match(helpers.pendingKindLabel({ pendingEditId: "edit-1" }), /Bản chỉnh sửa/);
  assert.match(helpers.pendingKindLabel({}), /Tin đăng mới/);
  assert.equal(helpers.pendingListingHref("id&next=/users"), "/properties/view?id=id%26next%3D%2Fusers");
  for (const date of [null, "invalid"]) assert.equal(helpers.formatSubmittedAt(date), "Chưa có thời gian gửi");
  assert.equal(helpers.queueBlockedMessage(true, "ready", false), null);
  assert.match(helpers.queueBlockedMessage(false, "ready", false), /đã tắt/);
  assert.match(helpers.queueBlockedMessage(true, "profile-error", false), /Không thể xác thực/);
  assert.match(helpers.queueBlockedMessage(true, "loading", false), /Đang xác thực/);
  assert.match(helpers.queueBlockedMessage(true, "ready", true), /Không có quyền/);
});

async function domTest(run) {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!doctype html><body><div id='root'></div></body>", { url: "http://localhost:5000/notifications" });
  const keys = ["window", "document", "navigator", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
  const old = new Map(keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[key] });
  const { createRoot } = require("react-dom/client");
  const root = createRoot(document.getElementById("root"));
  try { await run({ dom, root, act: React.act }); }
  finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, desc] of old) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; }
  }
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function listService() {
  const calls = [], listeners = new Set();
  return {
    calls,
    service: {
      findAll(params, signal, timeout) { const d = deferred(); calls.push({ ...d, params, signal, timeout }); return d.promise; },
      onModerationChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    },
    changed() { for (const fn of listeners) fn(); },
  };
}
const page = (title, totalPages = 3) => ({ result: [{ id: title, title, pendingEditId: null }], totalElements: 25, totalPages });

test("pending hook makes no closed/unauthorized fetch, guards account/query races and refreshes on moderation", async () => {
  await domTest(async ({ root, act }) => {
    const api = listService();
    const { usePendingListingRequests } = load("src/features/admin-queue/usePendingListingRequests.ts", {
      "@/services/admin-listing.service": { adminListingService: api.service },
    });
    let options = { owner: "admin-A", enabled: false, page: 1, size: 5, version: 0 };
    let state;
    function Probe() { state = usePendingListingRequests(options); return React.createElement("div", null, state.items.map((r) => r.title).join("|")); }
    const render = () => root.render(React.createElement(Probe));
    await act(async () => render()); assert.equal(api.calls.length, 0);
    options = { ...options, enabled: true }; await act(async () => render());
    assert.deepEqual(api.calls[0].params, { status: "PENDING_REVIEW", page: 1, size: 5, sort: "submittedAt,desc" });
    assert.equal(api.calls[0].timeout, 15000);
    await act(async () => api.calls[0].resolve(page("A-private"))); assert.match(document.body.textContent, /A-private/);
    options = { ...options, page: 2 }; await act(async () => render());
    assert.equal(api.calls[0].signal.aborted, true); assert.doesNotMatch(document.body.textContent, /A-private/);
    options = { ...options, owner: "admin-B" }; await act(async () => render());
    assert.equal(api.calls[1].signal.aborted, true);
    await act(async () => api.calls[1].resolve(page("late-A"))); assert.doesNotMatch(document.body.textContent, /late-A/);
    await act(async () => api.calls[2].resolve(page("B-current"))); assert.match(document.body.textContent, /B-current/);
    await act(async () => api.changed()); assert.equal(api.calls.length, 4);
    await act(async () => api.calls[3].reject({ response: { status: 403 } }));
    assert.equal(state.status, "forbidden"); assert.deepEqual(state.items, []);
    options = { ...options, enabled: false, owner: null }; await act(async () => render());
    await act(async () => api.changed()); assert.equal(api.calls.length, 4); assert.deepEqual(state.items, []);
  });
});

test("center paginates bounded server queries, debounces search, retries errors and renders actionable rows", async () => {
  await domTest(async ({ root, act }) => {
    const { MemoryRouter } = require("react-router-dom");
    const api = listService(), timers = new Map(); let seq = 0;
    const clock = { setTimeout(fn) { const id = ++seq; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); } };
    const queue = { active: true, enabled: true, access: "ready", owner: "admin-A", count: 25, status: "ready", version: 1 };
    const hook = load("src/features/admin-queue/usePendingListingRequests.ts", { "@/services/admin-listing.service": { adminListingService: api.service } });
    const Item = load("src/features/admin-queue/PendingListingItem.tsx", { "./pendingListing": helpers });
    const Page = load("src/pages/notifications/NotificationsPage.tsx", {
      "@/features/admin-queue/adminQueueContext": { useAdminQueue: () => queue },
      "@/features/admin-queue/pendingListing": helpers,
      "@/features/admin-queue/usePendingListingRequests": hook,
      "@/features/admin-queue/PendingListingItem": { __esModule: true, default: Item.default },
    }, clock).default;
    await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(Page))));
    assert.equal(api.calls[0].params.size, 10); assert.equal(api.calls[0].params.status, "PENDING_REVIEW");
    await act(async () => api.calls[0].resolve(page("new-listing")));
    assert.match(document.body.textContent, /Tin đăng mới chờ duyệt/);
    assert.equal(document.querySelector("a").getAttribute("href"), "/properties/view?id=new-listing");
    await act(async () => [...document.querySelectorAll("button")].find((b) => b.textContent === "Sau").click());
    assert.equal(api.calls.at(-1).params.page, 2);
    await act(async () => api.calls.at(-1).resolve(page("page-two")));
    const input = document.querySelector("input[type=search]");
    const tracker = input._valueTracker;
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, "room");
      tracker?.setValue("");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
      input.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    assert.equal(api.calls.length, 2, "no server search before debounce");
    await act(async () => { for (const [id, fn] of timers) { timers.delete(id); fn(); } });
    assert.equal(api.calls.at(-1).params.page, 1); assert.equal(api.calls.at(-1).params.keyword, "room");
    await act(async () => api.calls.at(-1).reject(new Error("network"))); assert.ok(document.querySelector("[role=alert]"));
    await act(async () => [...document.querySelectorAll("button")].find((b) => b.textContent === "Thử lại").click());
    await act(async () => api.calls.at(-1).resolve({ ...page("edit-listing"), result: [{ id: "edit&1", title: "Edited room", pendingEditId: "edit-1" }] }));
    assert.match(document.body.textContent, /Bản chỉnh sửa chờ duyệt/);
    assert.equal(document.querySelector("a").getAttribute("href"), "/properties/view?id=edit%261");
  });
});

test("bell preview fetches five only when open and links to the full center", async () => {
  await domTest(async ({ root, act }) => {
    const { MemoryRouter } = require("react-router-dom");
    const api = listService();
    const queue = { active: true, enabled: true, access: "ready", owner: "admin-A", count: 12, status: "ready", version: 1 };
    const hook = load("src/features/admin-queue/usePendingListingRequests.ts", { "@/services/admin-listing.service": { adminListingService: api.service } });
    const item = load("src/features/admin-queue/PendingListingItem.tsx", { "./pendingListing": helpers });
    const Bell = load("src/layouts/AdminQueueBell.tsx", {
      "@/features/admin-queue/adminQueueContext": { useAdminQueue: () => queue },
      "@/features/admin-queue/queueController": load("src/features/admin-queue/queueController.ts"),
      "@/features/admin-queue/usePendingListingRequests": hook,
      "@/features/admin-queue/PendingListingItem": { __esModule: true, default: item.default },
      "@/features/admin-queue/pendingListing": helpers,
    }).default;
    await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(Bell))));
    assert.equal(api.calls.length, 0);
    await act(async () => document.querySelector("button").click()); assert.equal(api.calls.length, 1);
    assert.equal(api.calls[0].params.size, 5);
    await act(async () => api.calls[0].resolve(page("real-task")));
    assert.match(document.body.textContent, /real-task/);
    assert.ok(document.querySelector("a[href='/notifications']"));
    assert.match(document.querySelector("button").getAttribute("aria-label"), /12/);
    await act(async () => document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(document.querySelector("[role=dialog]"), null);
    assert.equal(api.calls[0].signal.aborted, true);
    assert.match(document.querySelector("button").getAttribute("aria-label"), /12/);
  });
});

test("router keeps notification center behind admin layout and broadcast route distinct", () => {
  const placeholders = new Proxy({}, { get: (_target, name) => {
    if (name === "__esModule") return true;
    return () => null;
  } });
  const source = fs.readFileSync(new URL("../src/router/index.tsx", import.meta.url), "utf8");
  const names = [...source.matchAll(/from "(@\/[^"]+)"/g)].map((match) => match[1]);
  const deps = Object.fromEntries(names.map((name) => [name, placeholders]));
  const Router = load("src/router/index.tsx", deps).default;
  const tree = Router();
  const routes = React.Children.toArray(tree.props.children);
  const protectedRoute = routes.find((route) => route.props.element?.props?.children);
  const children = React.Children.toArray(protectedRoute.props.children);
  assert.ok(children.find((route) => route.props.path === "/notifications"));
  const operations = children.find((route) => route.props.path === "operations");
  assert.ok(React.Children.toArray(operations.props.children).find((route) => route.props.path === "notifications"));
});
