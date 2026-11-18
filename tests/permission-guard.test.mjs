import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = file => fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
function compile(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { module, exports: module.exports, require: name => dependencies[name] ?? require(name) });
  return module.exports;
}

const config = compile("src/config/permissions.ts");
const { PERMISSIONS, ROUTE_PERMISSIONS, hasPermission, ruleForPath } = config;
const state = { current: {} };
const hooks = compile("src/hooks/usePermission.ts", {
  "@/store/hooks": { useAppSelector: select => select(state.current) },
  "@/config/permissions": config,
});
const session = (role, status, granted) => ({ user: { profile: { role } }, permission: { status, granted } });

test("hasPermission all / any / empty", () => {
  const granted = ["USER_VIEW", "ROLE_VIEW"];
  assert.equal(hasPermission(granted, "USER_VIEW"), true);
  assert.equal(hasPermission(granted, ["USER_VIEW", "ROLE_VIEW"]), true);
  assert.equal(hasPermission(granted, ["USER_VIEW", "KYC_VIEW"]), false);
  assert.equal(hasPermission(granted, ["USER_VIEW", "KYC_VIEW"], "any"), true);
  assert.equal(hasPermission(granted, ["KYC_VIEW", "STORAGE_VIEW"], "any"), false);
  assert.equal(hasPermission([], "USER_VIEW"), false);
  assert.equal(hasPermission([], []), true);
  assert.equal(hasPermission(["ADMIN"], "ADMIN_ONLY_FAKE"), false);
});

test("useHasPermission needs loaded permissions and the ADMIN role", () => {
  state.current = session("ADMIN", "succeeded", ["USER_VIEW"]);
  assert.equal(hooks.useHasPermission("USER_VIEW"), true);
  assert.equal(hooks.useHasPermission("ROLE_VIEW"), false);
  assert.equal(hooks.usePermissionsStatus(), "succeeded");
  state.current = session("admin", "succeeded", ["USER_VIEW"]);
  assert.equal(hooks.useHasPermission("USER_VIEW"), true);
  state.current = session("USER", "succeeded", ["USER_VIEW"]);
  assert.equal(hooks.useHasPermission("USER_VIEW"), false);
  state.current = { user: { profile: null }, permission: { status: "succeeded", granted: ["USER_VIEW"] } };
  assert.equal(hooks.useHasPermission("USER_VIEW"), false);
  for (const status of ["idle", "loading", "failed"]) {
    state.current = session("ADMIN", status, ["USER_VIEW"]);
    assert.equal(hooks.useHasPermission("USER_VIEW"), false, status);
  }
});

test("useCanAccessPath hides gated paths until permissions load", () => {
  state.current = session("ADMIN", "loading", []);
  assert.equal(hooks.useCanAccessPath()("/users"), false);
  assert.equal(hooks.useCanAccessPath()("/dashboard"), true);
  state.current = session("ADMIN", "succeeded", ["DISPUTE_VIEW"]);
  const can = hooks.useCanAccessPath();
  assert.equal(can("/operations/complaints"), true);
  assert.equal(can("/users"), false);
});

test("route map: expected permissions and prefix matching", () => {
  const expected = {
    "/users": "USER_VIEW", "/users/roles": "ROLE_VIEW", "/users/permissions": "PERMISSION_VIEW",
    "/properties/pending": "LISTING_VIEW", "/properties/view": "LISTING_VIEW",
    "/contracts/templates": "CONTRACT_TEMPLATE_VIEW", "/contracts/templates/42": "CONTRACT_TEMPLATE_VIEW",
    "/contracts/fields": "CONTRACT_TEMPLATE_VIEW", "/contracts/all": "CONTRACT_VIEW",
    "/operations/notifications": "NOTIFICATION_BROADCAST", "/operations/system-alerts": "INCIDENT_VIEW",
  };
  for (const [path, code] of Object.entries(expected)) assert.equal(ruleForPath(path).permission, code, path);
  assert.deepEqual([...ruleForPath("/operations/complaints").permission], ["COMPLAINT_VIEW", "DISPUTE_VIEW"]);
  assert.equal(ruleForPath("/operations/complaints").mode, "any");
  for (const open of ["/dashboard", "/contracts/guide", "/operations/news", "/operations/knowledge", "/blockchain",
    "/analytics/statistics", "/settings/profile", "/notifications", "/usersx"]) assert.equal(ruleForPath(open), null, open);
  const codes = new Set(Object.values(PERMISSIONS));
  for (const rule of Object.values(ROUTE_PERMISSIONS)) {
    for (const code of [].concat(rule.permission)) assert.ok(codes.has(code), code);
  }
});

test("router gates exactly the route map and sidebar paths resolve through it", () => {
  const used = [...read("src/router/index.tsx").matchAll(/guard\("([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual([...new Set(used)].sort(), Object.keys(ROUTE_PERMISSIONS).sort());
  assert.match(read("src/router/index.tsx"), /ROUTE_PERMISSIONS\[key\]/);
  const sidebar = read("src/layouts/Sidebar.tsx");
  assert.match(sidebar, /useCanAccessPath/);
  const paths = [...sidebar.matchAll(/path: "(\/[^"]*)"/g)].map(m => m[1]);
  for (const key of Object.keys(ROUTE_PERMISSIONS)) {
    // every gated route key is reachable from the sidebar, except the nested template/detail prefix
    assert.ok(paths.some(path => path === key || path.startsWith(key + "/")), key);
  }
  assert.ok(ruleForPath("/properties"));
});

// The portal copy must equal backend Permissions.CATALOG (same codes, same order). Skipped when the sibling repo is absent.
const backendFile = new URL("../../hs-core-api/hs-common-service/src/main/java/com/hs/common/security/Permissions.java", import.meta.url);
test("PERMISSIONS equals backend Permissions.CATALOG", { skip: !fs.existsSync(backendFile) }, () => {
  const source = fs.readFileSync(backendFile, "utf8");
  const constants = Object.fromEntries([...source.matchAll(/public static final String (\w+) = "(\w+)";/g)].map(m => [m[1], m[2]]));
  const catalog = [...source.matchAll(/m\.put\((\w+),/g)].map(m => constants[m[1]]);
  assert.ok(catalog.length > 0 && catalog.every(Boolean), "could not parse CATALOG");
  assert.deepEqual(Object.values(PERMISSIONS), catalog);
  assert.deepEqual(Object.keys(PERMISSIONS), catalog);
  const userScope = source.match(/USER_SCOPE = (?:java\.util\.)?Set\.of\(([^)]*)\)/);
  assert.ok(userScope, "could not parse USER_SCOPE");
  const codes = userScope[1].split(",").map(item => constants[item.trim()]);
  assert.equal(codes.length, 12);
  assert.deepEqual([...config.USER_SCOPE_PERMISSIONS].sort(), codes.sort());
  assert.ok(catalog.length === 37 && catalog.filter(config.isUserScopePermission).length === 12);
});

test("permissionScope prefers the backend field and falls back to USER_SCOPE", () => {
  assert.equal(config.permissionScope({ name: "FAVORITE_USE" }), "USER");
  assert.equal(config.permissionScope({ name: "USER_VIEW" }), "ADMIN");
  assert.equal(config.permissionScope({ name: "USER_VIEW", scope: "USER" }), "USER");
  assert.equal(config.permissionScope({ name: "FAVORITE_USE", scope: null }), "USER");
});

test("the pending-review center route needs LISTING_VIEW; the personal feed stays open", () => {
  const router = read("src/router/index.tsx");
  assert.match(router, /path="\/notifications" element=\{<RequirePermission permission=\{PERMISSIONS\.LISTING_VIEW\}>/);
  assert.match(router, /path="\/notifications\/feed" element=\{<PersonalNotificationsPage \/>\}/);
});
