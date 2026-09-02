import test from "node:test";
import assert from "node:assert/strict";
import { blocksToEditorHtml } from "./newsEditorDocument.js";

test("renders text and image blocks in their saved order", () => {
  const html = blocksToEditorHtml([
    { id: "1", type: "PARAGRAPH", text: "Mở đầu" },
    { id: "2", type: "IMAGE", imageUrl: "blob:test", storageObjectId: null, altText: "Ảnh minh họa" },
    { id: "3", type: "HEADING", text: "Phần tiếp theo" },
  ]);

  assert.match(html, /^<p[^>]*>Mở đầu<\/p><figure/);
  assert.match(html, /<img[^>]*src="blob:test"[^>]*>/);
  assert.match(html, /<h2[^>]*>Phần tiếp theo<\/h2>$/);
});

test("escapes user text before inserting it into the editor", () => {
  const html = blocksToEditorHtml([
    { id: "1", type: "PARAGRAPH", text: '<script>alert("x")</script>' },
  ]);

  assert.equal(html.includes("<script>"), false);
  assert.match(html, /&lt;script&gt;/);
});
