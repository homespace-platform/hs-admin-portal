import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url), ts = require("typescript");

function fixture({ optedIn = true, permission = "granted", configured = true, put = async () => {} } = {}) {
  const stored = new Map([
    ["hs:admin-notification-push-enabled", String(optedIn)],
    ["hs:admin-notification-push-installation", JSON.stringify({
      installationId: "12345678-1234-4234-8234-123456789abc", installationSecret: "a".repeat(43),
    })],
  ]);
  const statuses = [], calls = [], auth = { authenticated: true };
  let registered, onMessage;
  const notification = { permission, requestPermission: async () => permission };
  const source = fs.readFileSync(new URL("../src/services/notification-push.service.ts", import.meta.url), "utf8")
    .replace(/import\.meta\.env\.VITE_FIREBASE_[A-Z_]+/g, configured ? '"test-public-value"' : '""');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const deps = {
    "@/lib/keycloak": auth,
    "@/lib/axios-client": {
      put: (...args) => { calls.push(["put", ...args]); return put(...args); },
      delete: async (...args) => { calls.push(["delete", ...args]); },
    },
    "firebase/app": { getApps: () => [{}], getApp: () => ({}) },
    "firebase/messaging": {
      getMessaging: () => ({}), isSupported: async () => true,
      onRegistered: (_, callback) => { registered = callback; return () => { registered = undefined; }; },
      onMessage: (_, callback) => { onMessage = callback; return () => { onMessage = undefined; }; },
      register: async () => { calls.push(["register"]); registered?.("c1234567890123456789012"); },
      unregister: async () => { calls.push(["unregister"]); },
    },
  };
  vm.runInNewContext(`(function(require,module,exports){${output}\n})`, {
    localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) },
    Notification: notification,
    window: { Notification: notification, dispatchEvent: event => statuses.push(event.detail) },
    navigator: { serviceWorker: { register: async () => ({}) } },
    CustomEvent: class { constructor(_, { detail }) { this.detail = detail; } },
  })(name => deps[name] ?? require(name), module, module.exports);
  return { api: module.exports, calls, statuses, stored, auth, message: () => onMessage?.() };
}

test("browser registration sends the installation proof and FID, then unregisters securely", async () => {
  const f = fixture(); let changed = 0;
  const stop = await f.api.startPush(() => changed++);
  await Promise.resolve();
  assert.equal(f.api.getPushStatus(), "registered");
  const request = f.calls.find(([method]) => method === "put");
  assert.equal(request[1], "/api/v1/notifications/devices");
  assert.deepEqual(JSON.parse(JSON.stringify(request[2])), {
    installationId: "12345678-1234-4234-8234-123456789abc", installationSecret: "a".repeat(43), fid: "c1234567890123456789012",
  });
  assert.equal(request[2].userId, undefined);
  f.message(); assert.equal(changed, 1);
  await f.api.disablePush();
  assert.equal(f.stored.get("hs:admin-notification-push-enabled"), "false");
  assert.equal(f.api.getPushStatus(), "disabled");
  assert.ok(f.calls.some(([method]) => method === "delete"));
  assert.ok(f.calls.some(([method]) => method === "unregister"));
  stop();
});

test("denied or unconfigured browsers make no registration requests", async () => {
  for (const options of [{ permission: "denied" }, { configured: false }]) {
    const f = fixture(options);
    await f.api.startPush(() => {});
    assert.equal(f.api.getPushStatus(), "unavailable");
    assert.equal(f.calls.length, 0);
  }
});

test("opt-out and a cleaned-up owner cannot register or replace current status", async () => {
  let resolve;
  const f = fixture({ put: () => new Promise(done => { resolve = done; }) });
  const stop = await f.api.startPush(() => {});
  stop();
  f.stored.set("hs:admin-notification-push-enabled", "false");
  const stopNext = await f.api.startPush(() => {});
  resolve(); await Promise.resolve();
  assert.equal(f.api.getPushStatus(), "disabled");
  assert.equal(f.statuses.includes("registered"), false);
  stopNext();
});

test("a failed backend registration remains retryable and logout removes device ownership", async () => {
  const f = fixture({ put: async () => { throw new Error("offline"); } });
  const stop = await f.api.startPush(() => {});
  await Promise.resolve(); await Promise.resolve();
  assert.equal(f.api.getPushStatus(), "error");
  await f.api.unregisterPushBeforeLogout();
  assert.ok(f.calls.some(([method]) => method === "delete"));
  stop();
});
