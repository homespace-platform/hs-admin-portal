import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { Editor } from '@tiptap/core';
import { knowledgeEditorExtensions } from '../src/components/knowledge/knowledge-editor-config.ts';
import { splitKnowledgeMarkdown, joinKnowledgeMarkdown, isSafeKnowledgeLink } from '../src/components/knowledge/knowledge-markdown.ts';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of ['window', 'document', 'navigator', 'Node', 'HTMLElement', 'DOMParser', 'MutationObserver', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;

function createEditor(body) {
  return new Editor({ extensions: knowledgeEditorExtensions(), content: body, contentType: 'markdown' });
}

test('editing preserves YAML identity, visibility and audience, including CRLF', () => {
  const source = '---\r\ndocument_id: private\r\nvisibility: admin\r\naudience: [admin]\r\nversion: 4\r\n---\r\n\r\n# Cũ';
  const parts = splitKnowledgeMarkdown(source);
  assert.equal(splitKnowledgeMarkdown(joinKnowledgeMarkdown(parts.metadata, '# Mới')).metadata, parts.metadata);
  assert.equal(splitKnowledgeMarkdown(joinKnowledgeMarkdown(parts.metadata, '# Mới')).body.trim(), '# Mới');
  assert.throws(() => splitKnowledgeMarkdown('# No metadata'));
});

test('only safe link protocols are accepted', () => {
  for (const value of ['https://homespace.example', 'http://localhost:5000', 'mailto:help@example.com']) assert.ok(isSafeKnowledgeLink(value));
  for (const value of ['javascript:alert(1)', 'data:text/html,x', 'file:///C:/secret', 'not a url']) assert.equal(isSafeKnowledgeLink(value), false);
});

test('rich editor displays formatted headings, bold, lists, links and tables', () => {
  const markdown = '# Tiêu đề\n\n**In đậm** và *nghiêng*.\n\n- Một\n- Hai\n\n> Trích dẫn\n\n[HomeSpace](https://example.com)\n\n| Cột A | Cột B |\n| --- | --- |\n| 1 | 2 |';
  const editor = createEditor(markdown);
  try {
    const html = editor.getHTML();
    for (const tag of ['<h1>', '<strong>', '<em>', '<ul>', '<blockquote>', '<a ', '<table', '<th', '<td']) assert.ok(html.includes(tag), tag);
    const rendered = editor.getMarkdown();
    const second = createEditor(rendered);
    try { assert.deepEqual(second.getJSON(), editor.getJSON()); } finally { second.destroy(); }
  } finally { editor.destroy(); }
});

test('rich text changes serialize into the Markdown sent to the version API', () => {
  const editor = createEditor('# HomeSpace\n\nNội dung ban đầu.');
  try {
    editor.commands.insertContent({ type: 'paragraph', content: [{ type: 'text', text: 'Nội dung đã sửa', marks: [{ type: 'bold' }] }] });
    const serialized = editor.getMarkdown();
    assert.ok(serialized.includes('**Nội dung đã sửa**'));
    const combined = joinKnowledgeMarkdown('---\ndocument_id: hs\nvisibility: public\n---\n', serialized);
    assert.ok(combined.includes('visibility: public'));
    assert.ok(combined.includes('**Nội dung đã sửa**'));
  } finally { editor.destroy(); }
});

test('switching an unchanged table document between modes preserves its canonical content', () => {
  const editor = createEditor('| A | B |\n| --- | --- |\n| 1 | 2 |');
  try {
    const baseline = editor.getMarkdown().trim();
    editor.commands.setContent(editor.getMarkdown(), { contentType: 'markdown', emitUpdate: false });
    assert.equal(editor.getMarkdown().trim(), baseline);
  } finally { editor.destroy(); }
});

const knowledge = new URL('../../hs-infrastructure/documents/knowledge/', import.meta.url);
for (const filename of readdirSync(knowledge).filter((name) => name.endsWith('.md') && name !== 'README.md')) {
  test(`round-trip preserves all formatted content: ${filename}`, () => {
    const { body } = splitKnowledgeMarkdown(readFileSync(new URL(filename, knowledge), 'utf8'));
    const editor = createEditor(body);
    const second = createEditor(editor.getMarkdown());
    try { assert.deepEqual(second.getJSON(), editor.getJSON()); }
    finally { second.destroy(); editor.destroy(); }
  });
}
