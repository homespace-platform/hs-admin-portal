import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function storageService(client) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(new URL("../src/services/storage.service.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => name === "@/lib/axios-client" ? { __esModule: true, default: client } : require(name) });
  return module.exports.default;
}

test("admin views another user's file through the STORAGE_VIEW admin route only", async () => {
  const calls = [];
  const service = storageService({ get: async (...args) => { calls.push(args); return { data: { result: { url: "https://signed.example/file", expiresAt: "2026-11-18T00:00:00Z" } } }; } });
  assert.equal(await service.getAdminFileUrl("obj/1"), "https://signed.example/file");
  assert.deepEqual(calls.map(call => call[0]), ["/api/v1/admin/storage/obj%2F1/download-url"]);
});

test("own-file helpers keep the normal storage routes", async () => {
  const calls = [];
  const service = storageService({ get: async (...args) => { calls.push(args[0]); return { data: { result: { url: "u" } } }; } });
  await service.getViewUrl("mine");
  assert.deepEqual(calls, ["/api/v1/storage/mine/view-url"]);
});

test("admin screens never read other users' evidence through /api/v1/storage", () => {
  for (const file of ["src/pages/operations/PaymentDisputesPanel.tsx", "src/pages/operations/RentalComplaintsPanel.tsx", "src/services/admin-complaint.service.ts"]) {
    const source = fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /getViewUrl|\/api\/v1\/storage|\/api\/v1\/contracts\/documents/, file);
  }
});
