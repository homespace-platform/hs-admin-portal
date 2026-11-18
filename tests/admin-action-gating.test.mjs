import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { permissionMocks } from "./helpers/permission-mocks.mjs";

const require = createRequire(import.meta.url);
const React = require("react"), { JSDOM } = require("jsdom"), { createRoot } = require("react-dom/client");
function load(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../" + file, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { module, exports: module.exports, AbortController, Number, Promise, URLSearchParams, encodeURIComponent, Date, console, require: name => dependencies[name] ?? require(name) });
  return module.exports;
}
const icons = new Proxy({}, { get: (_, key) => key === "__esModule" ? false : () => null });
const button = ({ children, ...props }) => React.createElement("button", props, children);
const ui = { Button: button, Badge: ({ children }) => React.createElement("span", null, children), Input: props => React.createElement("input", props) };

async function mount(element, run) {
  const dom = new JSDOM("<!doctype html><body><div id='root'></div></body>", { url: "http://localhost:5000/" });
  const keys = ["window", "document", "navigator", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
  const old = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[key] });
  const root = createRoot(dom.window.document.getElementById("root"));
  try {
    await React.act(async () => root.render(element));
    await run(dom.window.document);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, desc] of old) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; }
  }
}
const labels = document => [...document.querySelectorAll("button")].map(node => node.textContent.trim());

// ---- role editor -----------------------------------------------------------------------------
const permissions = ["USER_VIEW", "USER_UPDATE"].map(name => ({ id: name, name, description: name }));
const saved = [];
function roleModal(granted, role, isInitialEditing = true, allPermissions = permissions) {
  const Modal = load("src/components/rbac/RoleDetailsModal.tsx", {
    ...permissionMocks(granted),
    "lucide-react": icons, "@/components/ui/button": ui, "@/components/ui/badge": ui, sonner: { toast: { success() {}, error() {} } },
    "@/services/admin-rbac.service": { updateAdminRole: async (id, body) => { saved.push(body); return role; } },
    "@/utils/userUtils": { formatDate: () => "", formatAuditActor: () => "", getApiErrorMessage: () => "" },
    "./rbacUtils": { formatRoleLabel: name => name },
  }).default;
  return React.createElement(Modal, { isOpen: true, selectedRole: role, loadingDetails: false, isInitialEditing, allPermissions, onClose() {}, onRoleUpdated() {} });
}
const checkboxes = document => [...document.querySelectorAll("input[type=checkbox]")].map(node => ({ checked: node.checked, disabled: node.disabled }));

test("ADMIN role permission set is read-only with an explanation", async () => {
  const role = { id: "r-admin", name: "ADMIN", permissions };
  await mount(roleModal(["ROLE_VIEW", "ROLE_UPDATE"], role), document => {
    assert.deepEqual(checkboxes(document), [{ checked: true, disabled: true }, { checked: true, disabled: true }]);
    assert.match(document.querySelector("[role=note]").textContent, /ADMIN.*khóa/);
  });
});

test("USER role can only lose permissions, other roles stay editable", async () => {
  await mount(roleModal(["ROLE_UPDATE"], { id: "r-user", name: "USER", permissions: [permissions[0]] }), document => {
    assert.deepEqual(checkboxes(document), [{ checked: true, disabled: false }, { checked: false, disabled: true }]);
    assert.match(document.querySelector("[role=note]").textContent, /Quyền quản trị chỉ dành cho ADMIN/);
  });
  await mount(roleModal(["ROLE_UPDATE"], { id: "r-staff", name: "STAFF", permissions: [permissions[0]] }), document => {
    assert.deepEqual(checkboxes(document), [{ checked: true, disabled: false }, { checked: false, disabled: false }]);
    assert.equal(document.querySelector("[role=note]"), null);
  });
});

const scoped = ["USER_VIEW", "FAVORITE_USE", "KYC_SUBMIT"].map(name => ({ id: name, name, description: name }));
const clickLabel = async (document, text) => {
  const node = [...document.querySelectorAll("button")].find(item => item.textContent.trim() === text);
  await React.act(async () => node.click());
};

test("USER role toggles user-scope permissions; admin-scope ones stay disabled", async () => {
  const role = { id: "r-user", name: "USER", permissions: [scoped[1]] };
  await mount(roleModal(["ROLE_UPDATE"], role, true, scoped), async document => {
    const headings = [...document.querySelectorAll("section > div:first-child > p")].map(node => node.textContent);
    assert.deepEqual(headings, ["Quyền tính năng người dùng", "Quyền quản trị"]); // user scope first
    // order: FAVORITE_USE, KYC_SUBMIT (user scope), then USER_VIEW (admin scope)
    assert.deepEqual(checkboxes(document), [{ checked: true, disabled: false }, { checked: false, disabled: false }, { checked: false, disabled: true }]);
    assert.match(document.querySelector("[role=note]").textContent, /Quyền quản trị chỉ dành cho ADMIN/);
    await React.act(async () => document.querySelectorAll("input[type=checkbox]")[1].click());
    assert.equal(checkboxes(document)[1].checked, true);
    await clickLabel(document, "Tắt tất cả");
    assert.deepEqual(checkboxes(document).map(box => box.checked), [false, false, false]);
    await clickLabel(document, "Bật tất cả");
    assert.deepEqual(checkboxes(document).map(box => box.checked), [true, true, false]);
    await clickLabel(document, "Lưu thay đổi");
    assert.deepEqual([...saved.at(-1).permissionIdList].sort(), ["FAVORITE_USE", "KYC_SUBMIT"]);
  });
});

test("backend scope field overrides the local USER_SCOPE list; ADMIN stays locked for both scopes", async () => {
  const flagged = [{ id: "x", name: "BRAND_NEW", description: "", scope: "USER" }, scoped[0]];
  await mount(roleModal(["ROLE_UPDATE"], { id: "r-user", name: "USER", permissions: [] }, true, flagged), document => {
    assert.deepEqual(checkboxes(document), [{ checked: false, disabled: false }, { checked: false, disabled: true }]);
  });
  await mount(roleModal(["ROLE_UPDATE"], { id: "r-admin", name: "ADMIN", permissions: scoped }, true, scoped), document => {
    assert.ok(checkboxes(document).every(box => box.checked && box.disabled));
    assert.ok(!labels(document).includes("Bật tất cả"));
  });
});

test("role details hide the edit entry point without ROLE_UPDATE", async () => {
  const role = { id: "r-staff", name: "STAFF", permissions: [] };
  await mount(roleModal(["ROLE_VIEW"], role, false), document => assert.ok(!labels(document).includes("Chỉnh sửa")));
  await mount(roleModal(["ROLE_VIEW", "ROLE_UPDATE"], role, false), document => assert.ok(labels(document).includes("Chỉnh sửa")));
});

// ---- user modal ------------------------------------------------------------------------------
function userModal(granted, props = {}) {
  const roleCalls = [];
  const Modal = load("src/components/users/UserDetailsModal.tsx", {
    ...permissionMocks(granted),
    "lucide-react": icons, "@/components/ui/button": ui, "@/components/ui/input": ui,
    "@/components/common/UserAvatar": { __esModule: true, default: () => null },
    "./UserKycPanel": { __esModule: true, default: () => React.createElement("section", null, "KYC panel") },
    "@/services/admin-user.service": { updateAdminUser: async () => ({}) },
    "@/services/admin-rbac.service": { getAllAdminRoles: async () => { roleCalls.push("roles"); return [{ id: "r1", name: "USER" }]; } },
    sonner: { toast: { success() {}, error() {} } },
    "../../utils/userUtils": { formatRole: () => "Người dùng", formatGender: () => "", formatDate: () => "", parseAuditActor: () => ({}), getApiErrorMessage: () => "" },
    "@/components/rbac/rbacUtils": { formatRoleLabel: name => name },
  }).default;
  const user = { id: "u1", username: "u1", email: "u@x", role: "USER", roleId: "r1", active: true };
  return { roleCalls, element: React.createElement(Modal, { isOpen: true, selectedUser: user, loadingDetails: false, currentUserId: "admin", updatingId: null, resendingId: null, onClose() {}, onUserUpdated() {}, onToggleActive() {}, onResendInvitation() {}, ...props }) };
}

test("user modal shows only the actions the admin holds permissions for", async () => {
  const read = userModal(["USER_VIEW"]);
  await mount(read.element, document => {
    const text = labels(document).join("|");
    assert.doesNotMatch(text, /Chỉnh sửa|Gửi lại lời mời|Khóa tài khoản/); assert.doesNotMatch(document.body.textContent, /KYC panel/);
  });
  assert.deepEqual(read.roleCalls, []);
  const full = userModal(["USER_VIEW", "USER_CREATE", "USER_UPDATE", "KYC_VIEW"]);
  await mount(full.element, document => {
    const text = labels(document).join("|");
    assert.match(text, /Chỉnh sửa/); assert.match(text, /Gửi lại lời mời/); assert.match(text, /Khóa tài khoản/); assert.match(document.body.textContent, /KYC panel/);
  });
  const onlyResend = userModal(["USER_VIEW", "USER_CREATE"]);
  await mount(onlyResend.element, document => {
    const text = labels(document).join("|"); assert.match(text, /Gửi lại lời mời/); assert.doesNotMatch(text, /Chỉnh sửa|Khóa tài khoản/);
  });
});

test("role field is disabled and roles are not requested without ROLE_UPDATE + ROLE_VIEW", async () => {
  const noRole = userModal(["USER_VIEW", "USER_UPDATE"], { isInitialEditing: true });
  await mount(noRole.element, document => {
    const roleSelect = [...document.querySelectorAll("select")].pop();
    assert.equal(roleSelect.disabled, true); assert.match(document.body.textContent, /không có quyền thay đổi vai trò/);
  });
  assert.deepEqual(noRole.roleCalls, []);
  const withRole = userModal(["USER_VIEW", "USER_UPDATE", "ROLE_VIEW", "ROLE_UPDATE"], { isInitialEditing: true });
  await mount(withRole.element, document => assert.equal([...document.querySelectorAll("select")].pop().disabled, false));
  assert.deepEqual(withRole.roleCalls, ["roles"]);
});

// ---- nearby scans ----------------------------------------------------------------------------
function nearby(granted, requests) {
  const status = { syncEnabled: true, queryEnabled: true, jobs: [{ id: "j1", listing_id: "L1", radius_m: 2000, status: "PENDING", attempts: 0, next_attempt_at: "", updated_at: "2026-11-18T00:00:00Z" }] };
  const Page = load("src/pages/operations/NearbyScansPage.tsx", {
    ...permissionMocks(granted), "lucide-react": icons,
    "@/lib/axios-client": { __esModule: true, default: { get: async url => { requests.push(url); return { data: { result: status } }; }, post: async () => ({}) } },
  }).default;
  return React.createElement(Page);
}

test("nearby scans: no VIEW means no request, VIEW alone is read-only, MANAGE adds trigger and cancel", async () => {
  const none = [];
  await mount(nearby([], none), document => assert.match(document.body.textContent, /không có quyền xem/));
  assert.deepEqual(none, []);
  const viewOnly = [];
  await mount(nearby(["NEARBY_SCAN_VIEW"], viewOnly), document => {
    assert.deepEqual(viewOnly, ["/api/v1/admin/nearby-scans"]); assert.ok(document.body.textContent.includes("L1"));
    assert.doesNotMatch(labels(document).join("|"), /Đồng bộ|Hủy/); assert.equal(document.querySelector("form"), null);
  });
  const manage = [];
  await mount(nearby(["NEARBY_SCAN_VIEW", "NEARBY_SCAN_MANAGE"], manage), document => {
    assert.match(labels(document).join("|"), /Đồng bộ lại/); assert.match(labels(document).join("|"), /Hủy/); assert.ok(document.querySelector("form"));
  });
});
