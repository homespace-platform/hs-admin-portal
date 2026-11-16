import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const ts = require("typescript");
function load(file, dependencies) {
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename: file })(
    (name) => dependencies[name] ?? require(name), module, module.exports,
  );
  return module.exports;
}

function panel({ status = "NOT_VERIFIED", provider = "VNPT", cccd = "001234567890", active = true, verify = async () => ({ status: "VERIFIED", provider: "ADMIN" }) } = {}) {
  let index = 0;
  const changes = new Map();
  const values = [{ status, provider }, cccd, false, false, "", 0];
  const Component = load("src/components/users/UserKycPanel.tsx", {
    react: { ...React, useEffect() {}, useState: () => {
      const current = index++;
      return [values[current], (value) => changes.set(current, value)];
    } },
    "@/components/ui/button": { Button: (props) => React.createElement("button", props) },
    "@/components/ui/input": { Input: (props) => React.createElement("input", props) },
    "@/services/admin-user.service": { verifyAdminUserKyc: verify },
    "@/utils/userUtils": { getApiErrorMessage: (_, fallback) => fallback },
    sonner: { toast: { success() {} } },
  }).default;
  return { element: Component({ userId: "alice", active }), changes };
}
function find(element, type) {
  if (!element || typeof element !== "object") return null;
  if (element.type === type) return element;
  for (const child of React.Children.toArray(element.props?.children)) {
    const result = find(child, type);
    if (result) return result;
  }
  return null;
}

test("ADMIN and VNPT verified accounts do not offer another verification", () => {
  for (const provider of ["ADMIN", "VNPT"]) {
    const { element } = panel({ status: "VERIFIED", provider });
    const html = renderToStaticMarkup(element);
    assert.match(html, /Đã xác minh danh tính/);
    assert.equal(find(element, "form"), null);
  }
  assert.equal(find(panel({ active: false }).element, "form"), null);
});

test("manual verification preserves leading zero and uses the server result", async () => {
  const calls = [];
  const result = { status: "VERIFIED", provider: "ADMIN", verifiedAt: "2026-11-16T00:00:00Z" };
  const { element, changes } = panel({ verify: async (...args) => { calls.push(args); return result; } });
  await find(element, "form").props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls, [["alice", "001234567890"]]);
  assert.equal(changes.get(0), result);
  assert.equal(changes.get(1), "");
});

test("invalid identifier does not send a verification request", async () => {
  let called = false;
  const { element } = panel({ cccd: "bad", verify: async () => { called = true; } });
  await find(element, "form").props.onSubmit({ preventDefault() {} });
  assert.equal(called, false);
});

test("admin API uses scoped endpoints and only sends the citizen identifier", async () => {
  const calls = [];
  const service = load("src/services/admin-user.service.ts", {
    "@/lib/axios-client": {
      get: async (url) => { calls.push(["GET", url]); return { data: { result: {} } }; },
      post: async (url, data) => { calls.push(["POST", url, data]); return { data: { result: {} } }; },
    },
  });
  await service.getAdminUserKyc("alice");
  await service.verifyAdminUserKyc("alice", "001234567890");
  assert.deepEqual(calls, [
    ["GET", "/api/v1/admin/users/alice/kyc"],
    ["POST", "/api/v1/admin/users/alice/kyc/verify", { cccd: "001234567890" }],
  ]);
});
