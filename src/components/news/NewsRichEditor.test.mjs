import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("formatting a selected line does not refocus and scroll the editor", async () => {
  const source = await readFile(new URL("./NewsRichEditor.tsx", import.meta.url), "utf8");
  const formatBlock = source.match(/function formatBlock[\s\S]*?\n  }/)?.[0] ?? "";

  assert.doesNotMatch(formatBlock, /\.focus\(/);
});

test("editor does not rebuild DOM from the value it just emitted", async () => {
  const source = await readFile(new URL("./NewsRichEditor.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /internalChangeRef/);
  assert.match(source, /emittedValueRef\.current === value/);
});

test("rich editor is not wrapped by a label that activates Undo on content clicks", async () => {
  const source = await readFile(
    new URL("../../pages/operations/NewsManagementPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /<Field label="Nội dung bài viết"[\s\S]*?<NewsRichEditor[\s\S]*?<\/Field>/,
  );
});
