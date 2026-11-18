import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axios = require("axios");
function compile(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../" + file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { module, exports: module.exports, require: name => dependencies[name] ?? require(name) });
  return module.exports;
}
const apiError = compile("src/utils/apiError.ts");
const userUtils = compile("src/utils/userUtils.ts", { "@/utils/apiError": apiError });
const failure = (status, data, url = "/api/v1/admin/users/1") =>
  new axios.AxiosError("failed", "ERR_BAD_REQUEST", { url }, null, { status, data, headers: {}, config: { url } });

const expected = {
  2017: "Bạn không thể khóa tài khoản đang đăng nhập.",
  2019: "Không thể khóa/hạ quyền quản trị viên cuối cùng.",
  2020: "Bạn không thể chỉnh sửa người dùng đang nắm quyền mà bạn không có.",
  2103: "Bộ quyền của vai trò ADMIN bị khóa, không thể thay đổi.",
  2104: "Vai trò USER chỉ được cấp quyền tính năng người dùng",
  2203: "Bạn không thể cấp quyền mà chính bạn không có.",
};

test("RBAC business codes become Vietnamese in both error helpers", () => {
  for (const [code, message] of Object.entries(expected)) {
    const error = failure(code === "2019" ? 409 : 403, { code: Number(code), message: "English server text" });
    assert.equal(apiError.getApiErrorMessage(error, "fallback"), message, code);
    assert.equal(userUtils.getApiErrorMessage(error, "fallback"), message, code);
  }
});

test("a 403 without a business code, or with the AccessDenied code, gets the generic permission message", () => {
  const generic = "Bạn không có quyền thực hiện thao tác này.";
  assert.equal(apiError.getApiErrorMessage(failure(403, { code: 1003, message: "You do not have permission" })), generic);
  assert.equal(apiError.getApiErrorMessage(failure(403, { code: 1009, message: "Permission denied" })), generic);
  assert.equal(apiError.getApiErrorMessage(failure(403, "<html>Forbidden</html>")), generic);
  assert.equal(apiError.getApiErrorMessage(failure(403, { code: null })), generic);
  assert.equal(userUtils.getApiErrorMessage(failure(403, undefined), "fallback"), generic);
});

test("other codes keep the server message; broadcast keeps its own 2019 conflict text", () => {
  assert.equal(apiError.getApiErrorMessage(failure(409, { code: 2016, message: "Đã kích hoạt" })), "Đã kích hoạt");
  assert.equal(apiError.getApiErrorMessage(failure(403, { code: 4999, message: "Giữ nguyên thông báo nghiệp vụ" })), "Giữ nguyên thông báo nghiệp vụ");
  const broadcast = failure(409, { code: 2019, message: "Broadcast ID already has different content" }, "/api/v1/notifications/admin/broadcast");
  assert.equal(apiError.getApiErrorMessage(broadcast), "Broadcast ID already has different content");
});
