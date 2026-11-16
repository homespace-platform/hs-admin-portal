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

function panel(status) {
  let index = 0;
  const values = [{ status, provider: "VNPT" }, false, "", 0];
  const Component = load("src/components/users/UserKycPanel.tsx", {
    react: { ...React, useEffect() {}, useState: () => [values[index++], () => {}] },
    "@/components/ui/button": { Button: (props) => React.createElement("button", props) },
    "@/services/admin-user.service": { getAdminUserKyc: async () => values[0] },
    "@/utils/userUtils": { getApiErrorMessage: (_, fallback) => fallback },
  }).default;
  return renderToStaticMarkup(Component({ userId: "alice" }));
}

test("admin sees KYC status but cannot quick verify", () => {
  assert.match(panel("VERIFIED"), /Đã xác minh danh tính/);
  const unverified = panel("NOT_VERIFIED");
  assert.match(unverified, /Chưa xác minh danh tính/);
  assert.doesNotMatch(unverified, /<form|Xác minh KYC|Nhập CCCD/);
});

test("admin API only exposes KYC status read", async () => {
  const calls = [];
  const service = load("src/services/admin-user.service.ts", {
    "@/lib/axios-client": { get: async (url) => { calls.push(url); return { data: { result: {} } }; } },
  });
  await service.getAdminUserKyc("alice");
  assert.deepEqual(calls, ["/api/v1/admin/users/alice/kyc"]);
  assert.equal(service.verifyAdminUserKyc, undefined);
});
