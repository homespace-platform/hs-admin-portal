```
npm run dev
```

## Admin Knowledge editor

At `/operations/knowledge`, select a document and click **Xem tài liệu** or
**Chỉnh sửa nội dung**. The Tiptap editor renders Markdown with headings, bold,
italic, strike, lists, quotes, links, tables and undo/redo. Double-click the preview
to start editing. The optional **Mã Markdown** tab edits the body only.

YAML identity/ACL metadata stays outside the rich editor. **Lưu và embedding lại**
calls the existing version API with the expected version ID; it queues a new
version even when unchanged. The ingestion worker replaces old vectors only
after successful activation. No paid editor cloud service is used.

Run `npm run test:knowledge-editor` (Node 24) for conversion/metadata tests,
including all 15 sample knowledge documents. For visual testing while Vite is
running, open `/tests/knowledge-editor.preview.html`: this isolated harness uses
in-memory fixtures and does not contact the knowledge API or modify real data.
