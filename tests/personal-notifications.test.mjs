import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { permissionMocks } from "./helpers/permission-mocks.mjs";
const require = createRequire(import.meta.url), ts = require("typescript"), React = require("react");
function load(file, deps = {}, timers = globalThis) {
  const module = { exports: {} };
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    .replaceAll("import.meta.env.VITE_GATEWAY_BASE_URL", '"http://localhost:8080"')
    .replaceAll("import.meta.env.VITE_WEB_APP_URL", '"https://web.homespace.test"');
  const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInThisContext(`(function(require,module,exports,setTimeout,clearTimeout,setInterval,clearInterval){${output}\n})`)(name => deps[name] ?? require(name), module, module.exports, timers.setTimeout, timers.clearTimeout, timers.setInterval, timers.clearInterval);
  return module.exports;
}
const notice = { id: "notice-1", type: "COMPLAINT_ESCALATED", metadata: { caseId: "case-1", rentalRequestId: "rental-1", audience: "ADMIN" }, actionPath: "/operations/complaints?caseId=case-1" };
test("notification links preserve admin routes and send business events only to the configured web origin", () => {
  const { personalNotificationPath: path } = load("src/services/personal-notification.service.ts", { "@/lib/axios-client": {} });
  assert.equal(path(notice, true), "/operations/complaints?caseId=case-1");
  assert.equal(path(notice, false), null);
  assert.equal(path({ ...notice, metadata: { ...notice.metadata, audience: "PARTY" } }, true), null);
  for (const caseId of ["//evil", "../case", "", "x?other=y"]) assert.equal(path({ ...notice, metadata: { ...notice.metadata, caseId } }, true), null);
  for (const route of ["/dashboard/membership", "/chat?channel=direct&conversationId=room-1", "/news/article-1", "/favorites", "/rent/listing-1"]) {
    assert.equal(path({ ...notice, type: "MEMBERSHIP_ACTIVATED", actionPath: route }, true), `https://web.homespace.test${route}`);
  }
  for (const route of ["//evil.test", "/dashboard/../operations", "/dashboard\\evil", "/dashboard\nother", "/dashboard-bad", "/operations/complaints"]) {
    assert.equal(path({ ...notice, type: "OTHER", actionPath: route }, true), null);
  }
  assert.equal(path({ ...notice, type: "SYSTEM", actionPath: "https://evil.test" }, true), null);
  assert.equal(path({ ...notice, type: "KYC_VERIFIED", actionPath: "/settings/account-security" }, true), "/settings/account-security");
  assert.equal(path({ ...notice, type: "SYSTEM_INCIDENT_OPENED", metadata: { incidentId: "incident-1" } }, true), "/operations/system-alerts?incidentId=incident-1");
  assert.equal(path({ ...notice, type: "SYSTEM_INCIDENT_RESOLVED", metadata: { incidentId: "incident-1" } }, false), null);
});
test("personal feed API scopes identity on backend and encodes all mutation IDs", async () => {
  const calls = [], client = Object.fromEntries(["get", "patch", "delete"].map(method => [method, async (...args) => { calls.push([method, ...args]); return { data: { result: { count: 3, items: [], hasMore: false, nextCursor: null } } }; }]));
  const { personalNotificationService: service } = load("src/services/personal-notification.service.ts", { "@/lib/axios-client": client });
  assert.equal(await service.unread(), 3); await service.feed("cursor"); await service.read("a/b"); await service.remove("a/b"); await service.readAll();
  assert.equal(calls[1][2].params.cursor, "cursor"); assert.equal(calls[1][2].params.recipientId, undefined);
  assert.equal(calls[2][1], "/api/v1/notifications/a%2Fb/read"); assert.equal(calls[3][1], "/api/v1/notifications/a%2Fb"); assert.equal(calls[4][1], "/api/v1/notifications/read-all");
  client.get = async () => ({ data: { result: { count: -1 } } }); await assert.rejects(service.unread(), /không hợp lệ/);
});
test("preferences use the existing partial update contract without accepting a caller user id", async () => {
  const calls = [];
  const item = { category: "CONTRACT", push: false, email: true };
  const client = Object.fromEntries(["get", "patch"].map(method => [method, async (...args) => {
    calls.push([method, ...args]); return { data: { result: { items: [item] } } };
  }]));
  const { personalNotificationService: service } = load("src/services/personal-notification.service.ts", { "@/lib/axios-client": client });
  assert.deepEqual(await service.preferences(), [item]);
  assert.deepEqual(await service.setPush("CONTRACT", false), [item]);
  assert.deepEqual(calls, [["get", "/api/v1/notifications/preferences", { timeout: 10_000 }],
    ["patch", "/api/v1/notifications/preferences", { category: "CONTRACT", channel: "push", enabled: false }, { timeout: 10_000 }]]);
});
async function fixture(run) {
  const { JSDOM } = require("jsdom"), dom = new JSDOM("<body><div id='root'></div>", { url: "http://localhost:5000" });
  const keys = ["window", "document", "navigator", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
  const old = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[key] });
  const root = require("react-dom/client").createRoot(document.getElementById("root"));
  try { await run({ root, act: React.act }); } finally { await React.act(async () => root.unmount()); dom.window.close(); for (const [key, descriptor] of old) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}
test("socket uses Gateway and refreshed token, coalesces events, drops the old identity and cleans up", async () => fixture(async ({ root, act }) => {
  const timers = new Map(), intervals = new Map(); let next = 0, calls = 0, resolveCount;
  const clock = { setTimeout(fn, delay) { const id = ++next; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); }, setInterval(fn, delay) { const id = ++next; intervals.set(id, { fn, delay }); return id; }, clearInterval(id) { intervals.delete(id); } };
  const state = { auth: { userId: "admin-a" }, user: {} }, sockets = [], options = [], context = React.createContext(null);
  const keycloak = { token: "jwt-a", async updateToken() {} };
  const Provider = load("src/features/notifications/PersonalNotificationProvider.tsx", {
    "@/store/hooks": { useAppSelector: selector => selector(state) },
    "@/features/admin-queue/adminAccess": { resolveAdminAccess: auth => ({ access: "ready", userId: auth.userId }) },
    "@/services/personal-notification.service": { personalNotificationService: { unread: () => { calls++; return new Promise(resolve => { resolveCount = resolve; }); } } },
    "./personalNotificationContext": { PersonalNotificationContext: context }, "@/lib/keycloak": keycloak,
    "@/services/notification-push.service": { startPush: async () => () => {} },
    "socket.io-client": { io: (url, config) => { const handlers = {}; const socket = { handlers, connected: false, on(event, fn) { handlers[event] = fn; }, connect() { return socket; }, disconnect() { socket.disconnected = true; return socket; } }; sockets.push(socket); options.push({ url, ...config }); return socket; } },
  }, clock).default;
  let latest;
  function Child() { latest = React.useContext(context); return React.createElement("span", null, `${latest.owner}:${latest.count}`); }
  const render = () => root.render(React.createElement(Provider, null, React.createElement(Child)));
  await act(render); assert.equal(calls, 1); assert.equal(options[0].url, "http://localhost:8080/notifications"); assert.equal(options[0].path, "/api/v1/notifications/socket.io");
  let auth; await options[0].auth(value => { auth = value; }); await Promise.resolve(); assert.deepEqual(auth, { token: "jwt-a" });
  await act(async () => { resolveCount(4); }); assert.equal(latest.count, 4);
  await act(async () => { sockets[0].handlers["notification:new"](); sockets[0].handlers["notification:unread-count"](); });
  assert.equal([...timers.values()].filter(timer => timer.delay === 150).length, 1);
  await act(async () => { const timer = [...timers.values()].find(timer => timer.delay === 150); timer.fn(); }); assert.equal(calls, 2);
  const oldResponse = resolveCount;
  state.auth.userId = "admin-b"; await act(render); assert.equal(sockets[0].disconnected, true); assert.equal(latest.owner, "admin-b"); assert.equal(latest.count, null);
  await act(async () => { oldResponse(99); }); assert.equal(latest.count, null);
  await act(async () => root.unmount()); assert.equal(sockets[1].disconnected, true); assert.equal(intervals.size, 0);
}));

test("personal feed exposes read/delete actions, safe deep link and hides prior-account data immediately", async () => fixture(async ({ root, act }) => {
  let owner = "admin-a"; const calls = [], context = { version: 0, refresh: () => calls.push("refresh") };
  const data = { ...notice, title: "Cần xử lý khiếu nại", body: "Mở hồ sơ", createdAt: "2026-11-17T00:00:00Z", readAt: null };
  const Page = load("src/pages/notifications/PersonalNotificationsPage.tsx", {
    "react-router-dom": { Link: ({ to, children, ...props }) => React.createElement("a", { ...props, href: to }, children) },
    "@/features/notifications/personalNotificationContext": { usePersonalNotifications: () => ({ ...context, owner }) },
    "@/services/personal-notification.service": {
      personalNotificationPath: () => "/operations/complaints?caseId=case-1",
      personalNotificationService: { feed: async () => ({ items: [data], hasMore: false }), read: async id => calls.push(["read", id]), remove: async id => calls.push(["delete", id]), readAll: async () => calls.push("all") },
    },
  }).default;
  await act(async () => root.render(React.createElement(Page)));
  assert.match(document.body.textContent, /Cần xử lý khiếu nại/);
  assert.equal(document.querySelector('a[href*="caseId"]').getAttribute("href"), "/operations/complaints?caseId=case-1");
  const click = async text => act(async () => [...document.querySelectorAll("button")].find(button => button.textContent === text).click());
  await click("Đánh dấu đã đọc"); await click("Xóa"); await click("Đọc tất cả");
  assert.ok(calls.some(call => Array.isArray(call) && call[0] === "read" && call[1] === "notice-1"));
  assert.ok(calls.some(call => Array.isArray(call) && call[0] === "delete" && call[1] === "notice-1")); assert.ok(calls.includes("all"));
  owner = null; await act(async () => root.render(React.createElement(Page)));
  assert.doesNotMatch(document.body.textContent, /Cần xử lý khiếu nại/);
}));

test("complaint notification opens the exact protected detail and rejects a non-admin profile", async () => fixture(async ({ root, act }) => {
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  const calls = []; let role = "ADMIN", notificationVersion = 0, revision = 7;
  const Panel = load("src/pages/operations/RentalComplaintsPanel.tsx", {
    ...permissionMocks(), "sonner": { toast: { error() {} } }, "@/services/storage.service": {},
    "react-router-dom": { useSearchParams: () => [new URLSearchParams("caseId=case-1")] },
    "@/features/notifications/personalNotificationContext": { usePersonalNotifications: () => ({ version: notificationVersion }) },
    "@/features/auth/useAuth": { useAuth: () => ({ profile: { id: "admin-a", role } }) },
    "@/utils/apiError": { getApiErrorMessage: () => "denied" },
    "@/types/complaint.type": { complaintCategories: { OTHER: "Khác" }, complaintStages: {} },
    "@/components/complaint/ComplaintHistory": { __esModule: true, default: () => null },
    "@/services/admin-complaint.service": { adminComplaintService: { list: async () => ({ result: [], hasMore: false }), get: async id => { calls.push(id); return { id, revision, category: "OTHER", stage: "ESCALATED", status: "ESCALATED", reason: revision === 7 ? "Exact requested case" : "Stale detail", allowedActions: [], sources: [], evidenceIds: [], events: [] }; } } },
  }).default;
  await act(async () => root.render(React.createElement(Panel)));
  assert.deepEqual(calls, ["case-1"]); assert.equal(document.querySelector("dialog").open, true);
  notificationVersion++; revision = 6;
  await act(async () => root.render(React.createElement(Panel)));
  assert.deepEqual(calls, ["case-1", "case-1"]); assert.doesNotMatch(document.body.textContent, /Stale detail/);
  await act(async () => root.unmount());
  role = "USER";
  const secondRoot = require("react-dom/client").createRoot(document.getElementById("root"));
  try { await act(async () => secondRoot.render(React.createElement(Panel))); assert.deepEqual(calls, ["case-1", "case-1"]); }
  finally { await act(async () => secondRoot.unmount()); }
}));

test("operations screen highlights the requested incident and keeps resolved history", async () => fixture(async ({ root, act }) => {
  const items = [{ id: "incident-1", component: "BLOCKCHAIN", open: true, openedAt: "2026-11-17T00:00:00Z", resourceId: "doc-1" }, { id: "incident-2", component: "GATEWAY", open: false, openedAt: "2026-11-16T00:00:00Z", resolvedAt: "2026-11-17T00:00:00Z" }];
  const Page = load("src/pages/operations/SystemAlertsPage.tsx", {
    ...permissionMocks(),
    "react-router-dom": { useSearchParams: () => [new URLSearchParams("incidentId=incident-1")] },
    "@/features/notifications/personalNotificationContext": { usePersonalNotifications: () => ({ owner: "admin-a", version: 1, refresh() {} }) },
    "@/services/personal-notification.service": { listOperationalIncidents: async () => items },
  }).default;
  await act(async () => root.render(React.createElement(Page)));
  assert.equal(document.querySelector('[aria-current="true"]').id, "incident-incident-1");
  assert.match(document.body.textContent, /BLOCKCHAIN · Cần kiểm tra/); assert.match(document.body.textContent, /GATEWAY · Đã phục hồi/);
  assert.match(document.body.textContent, /doc-1/);
}));

test("notification settings persist push preferences, keep email unavailable and hide stale account responses", async () => fixture(async ({ root, act }) => {
  let owner = "admin-a", resolveSave;
  const calls = [], item = { category: "CONTRACT", push: true, email: true };
  const Section = load("src/components/settings/sections/NotificationsSection.tsx", {
    "@/features/auth/useAuth": { useAuth: () => ({ authenticated: true, userId: owner }) },
    "sonner": { toast: { success() {}, error() {} } },
    "@/services/personal-notification.service": { personalNotificationService: {
      preferences: async () => [{ ...item }],
      setPush: (category, enabled) => { calls.push([category, enabled]); return new Promise(resolve => { resolveSave = resolve; }); },
    } },
    "@/services/notification-push.service": {
      isPushConfigured: () => false, isPushOptedIn: () => false, getPushStatus: () => "unavailable",
      enablePush() {}, disablePush() {},
    },
  }).default;
  const render = () => root.render(React.createElement(Section));
  await act(async () => render());
  assert.match(document.body.textContent, /Email: sắp ra mắt/);
  const checkbox = document.querySelector('input[type="checkbox"]');
  assert.equal(checkbox.checked, true);
  await act(async () => checkbox.click());
  assert.deepEqual(calls, [["CONTRACT", false]]);
  owner = "admin-b";
  await act(async () => render());
  await act(async () => resolveSave([{ ...item, push: false }]));
  assert.equal(document.querySelector('input[type="checkbox"]').checked, true);
  assert.equal(document.querySelector("button").disabled, true);
}));
