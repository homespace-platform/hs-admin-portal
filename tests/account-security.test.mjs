import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const ts = require("typescript");

test("admin account security keeps password and SSO settings without self verification", () => {
  const source = fs.readFileSync(new URL("../src/components/settings/sections/AccountSecuritySection.tsx", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} };
  const dependencies = {
    react: { ...React, useState: (initial) => [initial, () => {}] },
    "@/services/user.service": { updatePassword() { throw Error("Unexpected API call"); } },
    "@/features/auth/useAuth": { useAuth: () => ({ logout() {} }) },
    sonner: { toast: { error() {}, success() {} } },
  };
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`)(
    (name) => dependencies[name] ?? require(name), module, module.exports,
  );
  const html = renderToStaticMarkup(React.createElement(module.exports.default));
  assert.match(html, /Thay đổi mật khẩu/);
  assert.match(html, /Bảo mật đăng nhập SSO/);
  assert.doesNotMatch(html, /KYC|VNPT|FPT|Viettel|Xác minh danh tính/);
});
