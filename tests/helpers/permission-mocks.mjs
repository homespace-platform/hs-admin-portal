import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript"), React = require("react");

const config = (() => {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../../src/config/permissions.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module, exports: module.exports });
  return module.exports;
})();

/** Test doubles for the permission hook and <Can>: pass the granted codes (or a getter, default: every code) to simulate an admin. */
export function permissionMocks(granted = Object.values(config.PERMISSIONS)) {
  const current = () => (typeof granted === "function" ? granted() : granted);
  const useHasPermission = (required, mode = "all") => config.hasPermission(current(), required, mode);
  const Can = ({ permission, mode = "all", fallback = null, children }) =>
    React.createElement(React.Fragment, null, useHasPermission(permission, mode) ? children : fallback);
  return {
    "@/config/permissions": config,
    "@/hooks/usePermission": { useHasPermission },
    "@/components/common/Can": { __esModule: true, default: Can },
  };
}
