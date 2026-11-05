import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript"), React = require("react");
function compile(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../" + file, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { module, exports: module.exports, require: name => dependencies[name] ?? require(name) });
  return module.exports;
}
const ui = Object.fromEntries(Object.entries({ Table: "table", TableBody: "tbody", TableCell: "td", TableHead: "th", TableHeader: "thead", TableRow: "tr" })
  .map(([name, tag]) => [name, props => React.createElement(tag, props)]));
const Table = compile("src/components/properties/ListingTable.tsx", {
  "@/components/ui/table": ui,
  "@/components/ui/skeleton": { Skeleton: () => null },
  "./ListingStatusBadge": { __esModule: true, default: ({ status }) => React.createElement("span", null, status) },
  "@/utils/listing-labels": { CATEGORY_NAMES: { ROOM: "Phòng trọ" } },
}).default;
function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(text).join("");
  return typeof node === "object" ? text(node.props?.children) : String(node);
}
function buttons(node, label) {
  if (node == null || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(child => buttons(child, label));
  return [...(node.type === "button" && text(node) === label ? [node] : []), ...buttons(node.props?.children, label)];
}
function row(status, pendingEditId) {
  const item = { id: "listing", category: "ROOM", title: "Phòng kiểm thử", status, pendingEditId, priceAmount: 4200000 };
  const views = [], moderation = [];
  const tree = Table({ listings: [item], loading: false, page: 1, size: 10,
    onViewDetails: listing => views.push(listing), onOpenModeration: (...args) => moderation.push(args) });
  return { item, tree, views, moderation };
}
for (const status of ["RESERVED", "RENTED", "PUBLISHED", "HIDDEN", "EXPIRED", "PENDING_REVIEW"]) {
  test(`${status}: a pending content edit opens review without publishing or changing its rental status`, () => {
    const f = row(status, "exact-edit-version");
    const review = buttons(f.tree, "Duyệt bản sửa");
    assert.equal(review.length, 1); review[0].props.onClick();
    assert.equal(f.views[0], f.item); assert.equal(f.item.status, status);
    assert.equal(buttons(f.tree, "Duyệt").length, 0); assert.deepEqual(f.moderation, []);
  });
}
test("new pending listings retain the original approve and reject actions", () => {
  const f = row("PENDING_REVIEW");
  assert.equal(buttons(f.tree, "Duyệt bản sửa").length, 0);
  buttons(f.tree, "Duyệt")[0].props.onClick(); buttons(f.tree, "Từ chối")[0].props.onClick();
  assert.deepEqual(f.moderation.map(call => call[1]), ["PUBLISHED", "REJECTED"]);
});
test("a reserved listing without a proposed edit has no approval action", () => {
  const f = row("RESERVED");
  assert.equal(buttons(f.tree, "Duyệt bản sửa").length, 0); assert.equal(buttons(f.tree, "Duyệt").length, 0);
});
test("edit decisions use the reviewed edit ID instead of the status moderation endpoint", async () => {
  const requests = [];
  const service = compile("src/services/admin-listing.service.ts", {
    "@/lib/axios-client": { __esModule: true, default: { patch: async (...args) => requests.push(args) } },
  }).default;
  await service.decideEdit("listing", "exact-edit-version", true, "");
  await service.decideEdit("listing", "exact-edit-version", false, "Nội dung cần sửa lại");
  assert.deepEqual(JSON.parse(JSON.stringify(requests)), [
    ["/api/v1/admin/listings/listing/edits/exact-edit-version", { approve: true, reason: "" }],
    ["/api/v1/admin/listings/listing/edits/exact-edit-version", { approve: false, reason: "Nội dung cần sửa lại" }],
  ]);
});
