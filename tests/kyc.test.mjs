import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const ts = require("typescript");
function load(file, dependencies, env = {}) {
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
  return module.exports.default;
}
function render(status = "NOT_VERIFIED") {
  let state = 0;
  const Component = load("src/components/settings/sections/KycSection.tsx", {
    react: { ...React, useCallback: (fn) => fn, useEffect() {}, useState: () => [
      state++ === 0 ? { status, verifiedAt: null, provider: "DIDIT" } : false, () => {},
    ] },
    "@/services/kyc.service": {},
    "@/features/user/userSlice": { fetchCurrentUser() {} },
    "@/store/hooks": { useAppDispatch: () => () => {}, useAppSelector: (selector) => selector({
      auth: {}, user: { profile: { role: "ADMIN" } },
    }) },
  }, { VITE_WEB_APP_URL: "https://homespace.example/" });
  return renderToStaticMarkup(React.createElement(Component));
}
test("admin verification links to the VNPT web flow and disables future providers", () => {
  const html = render();
  assert.match(html, /href="https:\/\/homespace.example\/settings\/account-security"/);
  assert.match(html, /FPT AI eKYC/);
  assert.match(html, /Viettel AI eKYC/);
  assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Didit|webhook/i);
});
test("a historically verified account stays verified without a new verification action", () => {
  const html = render("VERIFIED");
  assert.match(html, /Danh tính đã được xác minh/);
  assert.doesNotMatch(html, /href="https:\/\/homespace.example\/settings\/account-security"/);
});
test("admin service only uses generic status and cancellation endpoints", async () => {
  const calls = [];
  const service = load("src/services/kyc.service.ts", {
    "@/lib/axios-client": {
      get: async (url) => { calls.push(url); return { data: { result: {} } }; },
      post: async (url) => { calls.push(url); return { data: { result: {} } }; },
    },
  });
  await service.getStatus();
  await service.cancelSession();
  assert.deepEqual(calls, ["/api/v1/users/me/kyc", "/api/v1/users/me/kyc/session/cancel"]);
  assert.equal(service.createSession, undefined);
});
