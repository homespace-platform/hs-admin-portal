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
function row(status, pendingEditId, extra = {}) {
  const item = { id: "listing", category: "ROOM", title: "Phòng kiểm thử", status, pendingEditId, priceAmount: 4200000, ...extra };
  const views = [], moderation = [];
  const tree = Table({ listings: [item], loading: false, page: 1, size: 10,
    onViewDetails: listing => views.push(listing), onOpenModeration: (...args) => moderation.push(args) });
  return { item, tree, views, moderation };
}
for (const status of ["RESERVED", "RENTED", "PUBLISHED", "HIDDEN", "EXPIRED", "PENDING_REVIEW"]) {
  test(`${status}: submitted changes use normal approve/reject buttons and retain their reviewed version`, () => {
    const f = row(status, "exact-edit-version");
    assert.equal(buttons(f.tree, "Duyệt bản sửa").length, 0);
    const review = buttons(f.tree, "Duyệt");
    assert.equal(review.length, 1); review[0].props.onClick();
    assert.equal(f.moderation[0][0], f.item); assert.equal(f.moderation[0][0].pendingEditId, "exact-edit-version");
    assert.equal(f.moderation[0][1], "PUBLISHED"); assert.equal(f.item.status, status);
    assert.equal(buttons(f.tree, "Từ chối").length, 1); assert.deepEqual(f.views, []);
    assert.equal(buttons(f.tree, "Thuê ngoài").length, 0); assert.equal(buttons(f.tree, "Ẩn").length, 0);
    assert.doesNotMatch(text(f.tree), /Bản sửa chờ duyệt|Xem bản sửa/);
  });
}
test("new pending listings retain the original approve and reject actions", () => {
  const f = row("PENDING_REVIEW");
  assert.equal(buttons(f.tree, "Duyệt bản sửa").length, 0);
  buttons(f.tree, "Duyệt")[0].props.onClick(); buttons(f.tree, "Từ chối")[0].props.onClick();
  assert.deepEqual(f.moderation.map(call => call[1]), ["PUBLISHED", "REJECTED"]);
});

function find(node, predicate) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function moderation(status, targetStatus, { editId = "reviewed-edit", reason = "", error, operationalStatus, resultStatus } = {}) {
  let index = 0; const states = [reason, false, null], calls = [], results = [];
  const Dialog = compile("src/components/properties/ListingModerationDialog.tsx", {
    react: { ...React, useState: () => [states[index++], () => {}] },
    "@/config/listing-status.config": { getListingStatusConfig: () => ({ label: "Trạng thái" }) },
    "@/utils/apiError": { getApiErrorMessage: e => e.message },
    "@/services/admin-listing.service": { __esModule: true, default: {
      decideEdit: async (...args) => { calls.push(["edit", ...args]); if (error) throw error; return { status: resultStatus ?? operationalStatus ?? status }; },
      changeStatus: async (...args) => { calls.push(["status", ...args]); },
    } },
  }).default;
  const tree = Dialog({ isOpen: true, listing: { id: "listing", title: "Tin mới nhất", status, operationalStatus },
    targetStatus, pendingEditId: editId, onClose() {}, onSuccess: status => results.push(status) });
  const submit = () => find(tree, node => node.type === "form").props.onSubmit({ preventDefault() {} });
  return { tree, calls, results, submit };
}
for (const status of ["RESERVED", "RENTED", "PUBLISHED", "HIDDEN", "EXPIRED"]) {
  test(`${status}: approval reports the actual state returned by the API`, async () => {
    const expected = status === "EXPIRED" ? "PUBLISHED" : status;
    const f = moderation("PENDING_REVIEW", "PUBLISHED", { operationalStatus: status, resultStatus: expected });
    assert.equal(buttons(f.tree, "Duyệt tin đăng").length, 1);
    if (["RESERVED", "RENTED"].includes(status)) assert.match(text(f.tree), /giữ tình trạng giữ chỗ hoặc cho thuê/);
    else if (status === "HIDDEN") assert.match(text(f.tree), /tiếp tục được ẩn/);
    else assert.match(text(f.tree), /công khai hiển thị/);
    await f.submit();
    assert.deepEqual(f.calls, [["edit", "listing", "reviewed-edit", true, ""]]);
    assert.deepEqual(f.results, [expected]);
  });
}
test("rejecting submitted changes requires a reason and retains the original rental status", async () => {
  const empty = moderation("RENTED", "REJECTED"); await empty.submit(); assert.deepEqual(empty.calls, []);
  const f = moderation("RENTED", "REJECTED", { reason: "Thông tin chưa đúng" }); await f.submit();
  assert.deepEqual(f.calls, [["edit", "listing", "reviewed-edit", false, "Thông tin chưa đúng"]]);
  assert.deepEqual(f.results, ["RENTED"]);
});

test("signing while the review dialog is open reports RENTED from the decision response", async () => {
  const f = moderation("PENDING_REVIEW", "PUBLISHED", { operationalStatus: "RESERVED", resultStatus: "RENTED" });
  await f.submit(); assert.deepEqual(f.results, ["RENTED"]);
});

test("an occupied row cannot be republished or unlocked through generic status actions", () => {
  const pending = row("PENDING_REVIEW", null, { protectedRental: true });
  assert.equal(buttons(pending.tree, "Duyệt")[0].props.disabled, true);
  const violation = row("VIOLATION", null, { protectedRental: true });
  assert.equal(buttons(violation.tree, "Mở khóa")[0].props.disabled, true);
  assert.equal(buttons(violation.tree, "Hiển thị lại")[0].props.disabled, true);
  const content = row("PENDING_REVIEW", "edit", { protectedRental: true, operationalStatus: "RESERVED" });
  assert.equal(buttons(content.tree, "Duyệt")[0].props.disabled, false);
});
test("new listings retain status-based publication", async () => {
  const f = moderation("PENDING_REVIEW", "PUBLISHED", { editId: null }); await f.submit();
  assert.deepEqual(f.calls, [["status", "listing", "PUBLISHED", ""]]); assert.deepEqual(f.results, ["PUBLISHED"]);
});
test("a stale reviewed version fails without retrying or reporting success", async () => {
  const f = moderation("RESERVED", "PUBLISHED", { error: new Error("Bản sửa đã thay đổi") }); await f.submit();
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0][2], "reviewed-edit"); assert.deepEqual(f.results, []);
});
for (const reviewError of [undefined, "Chi nhánh đã ngừng hoạt động"]) {
test(`admin detail uses normal sections and moderation controls${reviewError ? " and safely handles unavailable submitted content" : ""}`, () => {
  const updates = []; let index = 0;
  const listing = { id: "listing", category: "ROOM", title: "Phòng mới R202", status: "PENDING_REVIEW", operationalStatus: "RESERVED", description: "Nội dung mới cần duyệt",
    pricing: { amount: 4200000, minimumLeaseMonths: 3 }, media: [], address: { display: "Địa chỉ mới", city: "TP.HCM", ward: "An Nhơn" },
    policies: [{ code: "quiet", label: "Giờ yên tĩnh", displayValue: "Sau 22 giờ" }] };
  const data = { listing, statusHistory: [], pendingEditId: "reviewed-edit", reviewError, protectedRental: true };
  const state = [data, false, "", null];
  const Dialog = () => null;
  const Page = compile("src/pages/properties/PropertyViewPage.tsx", {
    react: { ...React, useEffect() {}, useState: () => { const i = index++; return [state[i], value => updates.push([i, value])]; } },
    "react-router-dom": { useSearchParams: () => [new URLSearchParams("id=listing")], useNavigate: () => () => {}, Link: ({ children }) => React.createElement("a", null, children) },
    "@/features/auth/useAuth": { useAuth: () => ({ userId: "admin" }) },
    "@/components/properties/ListingModerationDialog": { __esModule: true, default: Dialog },
    "@/components/properties/ListingStatusBadge": { __esModule: true, default: ({ status }) => React.createElement("span", null, status) },
    "@/components/properties/ListingStatusHistoryTimeline": { __esModule: true, default: () => null },
    "@/components/properties/AdminMediaViewer": { __esModule: true, default: () => null },
    "@/components/common/UserAvatar": { __esModule: true, default: () => null },
    "@/utils/listing-labels": compile("src/utils/listing-labels.ts"),
    "@/services/admin-listing.service": { __esModule: true, default: {} },
    "@/utils/apiError": { getApiErrorMessage: e => e.message },
  }).default;
  const tree = Page(); const html = require("react-dom/server").renderToStaticMarkup(tree);
  assert.match(html, /Phòng mới R202/); assert.match(html, /Nội dung mới cần duyệt/); assert.match(html, /Địa chỉ mới/);
  assert.match(html, /Giờ yên tĩnh/); assert.match(html, /Sau 22 giờ/);
  assert.doesNotMatch(html, /Bản sửa chờ duyệt|Nội dung đang áp dụng|Nội dung đề xuất|Duyệt bản sửa/);
  const approve = buttons(tree, "Phê duyệt")[0];
  assert.equal(approve.props.disabled, Boolean(reviewError));
  if (reviewError) assert.match(html, /Không thể tải nội dung gửi duyệt/);
  else { approve.props.onClick(); assert.deepEqual(updates, [[3, "PUBLISHED"]]); }
  assert.equal(buttons(tree, "Từ chối").length, 1);
  const dialog = find(tree, node => node.type === Dialog);
  assert.equal(dialog.props.pendingEditId, "reviewed-edit"); assert.equal(dialog.props.listing.status, "PENDING_REVIEW");
});
}
test("a reserved listing without a proposed edit has no approval action", () => {
  const f = row("RESERVED");
  assert.equal(buttons(f.tree, "Duyệt bản sửa").length, 0); assert.equal(buttons(f.tree, "Duyệt").length, 0);
});
test("edit decisions use the reviewed edit ID instead of the status moderation endpoint", async () => {
  const requests = [];
  const service = compile("src/services/admin-listing.service.ts", {
    "@/lib/axios-client": { __esModule: true, default: { patch: async (...args) => { requests.push(args); return { data: { result: { status: "RENTED" } } }; } } },
  }).default;
  assert.equal((await service.decideEdit("listing", "exact-edit-version", true, "")).status, "RENTED");
  await service.decideEdit("listing", "exact-edit-version", false, "Nội dung cần sửa lại");
  assert.deepEqual(JSON.parse(JSON.stringify(requests)), [
    ["/api/v1/admin/listings/listing/edits/exact-edit-version", { approve: true, reason: "" }],
    ["/api/v1/admin/listings/listing/edits/exact-edit-version", { approve: false, reason: "Nội dung cần sửa lại" }],
  ]);
});
