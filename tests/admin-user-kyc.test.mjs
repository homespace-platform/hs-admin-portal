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

function panel(kyc) {
  let index = 0;
  const values = [kyc, false, "", 0, false];
  const Component = load("src/components/users/UserKycPanel.tsx", {
    react: { ...React, useEffect() {}, useState: () => [values[index++], () => {}] },
    "@/components/ui/button": { Button: (props) => React.createElement("button", props) },
    "@/components/common/Can": { __esModule: true, default: ({ children }) => children },
    "@/utils/manualKyc": load("src/utils/manualKyc.ts", {}),
    "@/config/permissions": { PERMISSIONS: { KYC_MANAGE: "KYC_MANAGE" } },
    "./ManualKycDialog": { __esModule: true, default: () => null },
    "@/services/admin-user.service": { getAdminUserKyc: async () => values[0] },
    "@/utils/userUtils": { getApiErrorMessage: (_, fallback) => fallback },
  }).default;
  return renderToStaticMarkup(Component({ userId: "alice" }));
}

test("panel shows verified provider/time or unverified, with the manual action", () => {
  const verified = panel({ verified: true, provider: "ADMIN", providerLabel: "Quản trị viên", verifiedAt: "2026-11-27T03:00:00Z" });
  assert.match(verified, /Đã xác minh · Quản trị viên · 10:[0-9]{2} 27\/11\/2026/);
  assert.match(verified, /Xác thực lại KYC \(ghi đè\)/);
  const unverified = panel({ verified: false, provider: null, providerLabel: null, verifiedAt: null });
  assert.match(unverified, /Chưa xác minh/);
  assert.match(unverified, /Xác thực KYC thủ công/);
});

test("admin API reads status and PUTs manual KYC", async () => {
  const calls = [];
  const service = load("src/services/admin-user.service.ts", {
    "@/lib/axios-client": {
      get: async (url) => { calls.push(["GET", url]); return { data: { result: {} } }; },
      put: async (url, body) => { calls.push(["PUT", url, body]); return { data: { result: {} } }; },
    },
  });
  await service.getAdminUserKyc("alice");
  await service.setAdminUserKyc("alice", { cccd: "1" });
  assert.deepEqual(calls, [["GET", "/api/v1/admin/users/alice/kyc"], ["PUT", "/api/v1/admin/users/alice/kyc", { cccd: "1" }]]);
});

const valid = { cccd: "001234567890", fullName: "A", birthDate: "2000-01-31", gender: "Nam", permanentAddress: "x", issueDate: "2021-05-01", expirationDate: "2036-05-01", issuePlace: "y" };
const { validateManualKyc, isIsoDate, formatVerifiedAt } = load("src/utils/manualKyc.ts", {});

test("manual KYC validation mirrors server rules", () => {
  assert.deepEqual(validateManualKyc(valid, "2026-11-27"), {});
  assert.ok(validateManualKyc({ ...valid, cccd: "12345" }, "2026-11-27").cccd);
  assert.ok(validateManualKyc({ ...valid, fullName: " " }, "2026-11-27").fullName);
  assert.ok(validateManualKyc({ ...valid, gender: "" }, "2026-11-27").gender);
  assert.ok(validateManualKyc({ ...valid, issueDate: "2026-11-28" }, "2026-11-27").issueDate);
  assert.equal(validateManualKyc({ ...valid, issueDate: "2026-11-27", expirationDate: "2036-01-01" }, "2026-11-27").issueDate, undefined);
  assert.ok(validateManualKyc({ ...valid, expirationDate: "2021-05-01" }, "2026-11-27").expirationDate);
  assert.ok(validateManualKyc({ ...valid, birthDate: "2021-05-01" }, "2026-11-27").birthDate);
  assert.ok(validateManualKyc({ ...valid, birthDate: "" }, "2026-11-27").birthDate);
});

test("date conversion helpers", () => {
  assert.equal(isIsoDate("2000-02-29"), true);
  assert.equal(isIsoDate("2001-02-29"), false);
  assert.equal(isIsoDate("31/01/2000"), false);
  assert.equal(formatVerifiedAt("2026-11-27T03:05:00Z"), "10:05 27/11/2026");
  assert.equal(formatVerifiedAt(null), "");
});
