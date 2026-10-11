import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Link, Unlink, Undo2, Redo2, Table2, Loader2, Save, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { adminKnowledgeService } from "@/services/admin-knowledge.service";
import type { KnowledgeContent, KnowledgeUploadResult } from "@/types/knowledge.type";
import { getApiErrorMessage } from "@/utils/apiError";
import { knowledgeEditorExtensions } from "./knowledge-editor-config";
import { splitKnowledgeMarkdown, joinKnowledgeMarkdown, isSafeKnowledgeLink } from "./knowledge-markdown";
import "./knowledge-editor.css";

type Props = {
  documentId: string; editable: boolean; canEdit: boolean;
  onEdit: () => void; onClose: () => void;
  onSaved: (result: KnowledgeUploadResult) => void;
  onDirtyChange: (dirty: boolean) => void; onSavingChange: (saving: boolean) => void;
};

export default function KnowledgeMarkdownEditor(props: Props) {
  const [source, setSource] = useState<KnowledgeContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void adminKnowledgeService.content(props.documentId).then((value) => {
      if (!cancelled) setSource(value);
    }).catch((failure: unknown) => {
      if (!cancelled) setError(getApiErrorMessage(failure, "Không mở được nội dung tài liệu."));
    });
    return () => { cancelled = true; };
  }, [props.documentId]);
  if (error) return <p role="alert" className="rounded-lg border p-4 text-sm text-destructive">{error}</p>;
  if (!source) return <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang mở tài liệu...</p>;
  return <LoadedEditor key={source.versionId} {...props} source={source} />;
}

function LoadedEditor({ source, editable, canEdit, onEdit, onSaved, onClose, onDirtyChange, onSavingChange }: Props & { source: KnowledgeContent }) {
  const [parts] = useState(() => {
    try { return { ...splitKnowledgeMarkdown(source.markdown), error: null }; }
    catch (failure) { return { metadata: "", body: "", error: (failure as Error).message }; }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [rawMode, setRawMode] = useState(false);
  const [rawBody, setRawBody] = useState(parts.body);
  const baseline = useRef("");
  const draftBody = useRef(parts.body);
  const editor = useEditor({
    extensions: knowledgeEditorExtensions(), content: parts.body, contentType: "markdown",
    editable: editable && canEdit && !saving && !parts.error,
    editorProps: { attributes: { class: "knowledge-prose", "aria-label": "Nội dung tài liệu", role: "textbox", "aria-multiline": "true" } },
    onCreate: ({ editor: created }) => { baseline.current = created.getMarkdown().trim(); },
    onUpdate: ({ editor: updated }) => {
      const markdown = updated.getMarkdown();
      const changed = markdown.trim() !== baseline.current;
      draftBody.current = changed ? markdown : parts.body;
      setDirty(changed); onDirtyChange(changed);
    },
  });
  const state = useEditorState({ editor, selector: ({ editor: value }) => ({
    bold: value?.isActive("bold"), italic: value?.isActive("italic"), strike: value?.isActive("strike"),
    bullet: value?.isActive("bulletList"), ordered: value?.isActive("orderedList"), quote: value?.isActive("blockquote"),
    link: value?.isActive("link"), table: value?.isActive("table"), heading: value?.getAttributes("heading").level ?? 0,
    undo: value?.can().undo() ?? false, redo: value?.can().redo() ?? false,
  }) });
  useEffect(() => { editor?.setEditable(editable && canEdit && !saving && !parts.error); }, [editor, editable, canEdit, saving, parts.error]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function cancel() {
    if (dirty && !window.confirm("Bỏ nội dung chỉnh sửa chưa lưu?")) return;
    editor?.commands.setContent(parts.body, { contentType: "markdown", emitUpdate: false });
    draftBody.current = parts.body; setRawBody(parts.body); setRawMode(false);
    setDirty(false); onDirtyChange(false); setError(null); onClose();
  }
  function toggleMode() {
    if (!editor) return;
    if (rawMode) editor.commands.setContent(rawBody, { contentType: "markdown", emitUpdate: false });
    else setRawBody(draftBody.current);
    setRawMode(!rawMode);
  }
  function editLink() {
    if (!editor) return;
    const href = window.prompt("Địa chỉ liên kết (https://... hoặc mailto:...)", editor.getAttributes("link").href ?? "https://");
    if (href === null) return;
    if (!href.trim()) { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    if (!isSafeKnowledgeLink(href.trim())) { toast.error("Chỉ cho phép liên kết http, https hoặc mailto."); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }
  async function save() {
    if (!editor || parts.error || saving || !canEdit) return;
    // Preserve original bytes on unchanged saves, while still creating a new version.
    const markdown = dirty ? joinKnowledgeMarkdown(parts.metadata, rawMode ? rawBody : draftBody.current) : source.markdown;
    if (!splitKnowledgeMarkdown(markdown).body.trim()) { toast.error("Nội dung tài liệu không được để trống."); return; }
    if (new TextEncoder().encode(markdown).length > 1024 * 1024) { toast.error("Nội dung tối đa 1 MB UTF-8."); return; }
    setSaving(true); onSavingChange(true); setError(null);
    try {
      const result = await adminKnowledgeService.updateContent(source.documentId, markdown, source.versionId);
      onDirtyChange(false);
      toast.success(`Đã lưu v${result.version}. Worker đang embedding lại; bản cũ được thay sau khi thành công.`);
      onSaved(result);
    } catch (failure) { setError(getApiErrorMessage(failure, "Không lưu được tài liệu.")); }
    finally { setSaving(false); onSavingChange(false); }
  }
  function tool(label: string, icon: ReactNode, action: () => void, active = false, disabled = false) {
    return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={saving || disabled}
      onMouseDown={(event) => event.preventDefault()} onClick={action}
      className={`rounded-md p-2 disabled:opacity-35 ${active ? "bg-primary/15 text-primary" : "hover:bg-muted"}`}>{icon}</button>;
  }
  const icon = "h-4 w-4";

  return <section className="overflow-hidden rounded-xl border bg-background">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
      <div><h3 className="text-sm font-semibold">{source.sourceFilename} · v{source.version}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{editable ? (dirty ? "Có thay đổi chưa lưu" : "Đang chỉnh sửa") : "Xem trước tài liệu — nhấn Chỉnh sửa để gõ trực tiếp"}</p></div>
      {editable ? <div className="flex gap-2">
        <button type="button" disabled={saving} onClick={cancel} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><X className={icon} /> Huỷ</button>
        <button type="button" disabled={saving || !!parts.error || !editor || !canEdit} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className={`${icon} animate-spin`} /> : <Save className={icon} />} Lưu và embedding lại
        </button>
      </div> : <button type="button" disabled={!canEdit} onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs disabled:opacity-40"><Pencil className={icon} /> Chỉnh sửa</button>}
    </div>
    {parts.error && <p role="alert" className="p-4 text-sm text-destructive">{parts.error}</p>}
    {editable && editor && !parts.error && <>
      <div role="toolbar" aria-label="Định dạng tài liệu" className="flex flex-wrap items-center gap-1 border-b p-2">
        <button type="button" disabled={saving} onClick={toggleMode} className={`rounded-md border px-2 py-1.5 text-xs ${rawMode ? "bg-primary/10 text-primary" : ""}`}>{rawMode ? "Soạn thảo trực quan" : "Mã Markdown"}</button>
        {!rawMode && <>
          <select aria-label="Kiểu đoạn văn" disabled={saving} value={state?.heading ?? 0} onChange={(event) => {
            const level = Number(event.target.value);
            if (!level) editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
          }} className="rounded border bg-background px-2 py-1.5 text-xs">
            <option value={0}>Đoạn văn</option>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>Tiêu đề {level}</option>)}
          </select>
          {tool("In đậm (Ctrl+B)", <Bold className={icon} />, () => editor.chain().focus().toggleBold().run(), state?.bold)}
          {tool("In nghiêng (Ctrl+I)", <Italic className={icon} />, () => editor.chain().focus().toggleItalic().run(), state?.italic)}
          {tool("Gạch ngang", <Strikethrough className={icon} />, () => editor.chain().focus().toggleStrike().run(), state?.strike)}
          {tool("Danh sách", <List className={icon} />, () => editor.chain().focus().toggleBulletList().run(), state?.bullet)}
          {tool("Danh sách đánh số", <ListOrdered className={icon} />, () => editor.chain().focus().toggleOrderedList().run(), state?.ordered)}
          {tool("Trích dẫn", <Quote className={icon} />, () => editor.chain().focus().toggleBlockquote().run(), state?.quote)}
          {tool("Liên kết", <Link className={icon} />, editLink, state?.link)}
          {tool("Bỏ liên kết", <Unlink className={icon} />, () => editor.chain().focus().extendMarkRange("link").unsetLink().run(), false, !state?.link)}
          {tool("Chèn bảng 3×3", <Table2 className={icon} />, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
          {tool("Hoàn tác (Ctrl+Z)", <Undo2 className={icon} />, () => editor.chain().focus().undo().run(), false, !state?.undo)}
          {tool("Làm lại (Ctrl+Shift+Z)", <Redo2 className={icon} />, () => editor.chain().focus().redo().run(), false, !state?.redo)}
        </>}
      </div>
      {!rawMode && state?.table && <div role="toolbar" aria-label="Chỉnh sửa bảng" className="flex flex-wrap items-center gap-2 border-b p-2 text-xs">
        {tool("Thêm hàng", "＋ Hàng", () => editor.chain().focus().addRowAfter().run())}
        {tool("Thêm cột", "＋ Cột", () => editor.chain().focus().addColumnAfter().run())}
        {tool("Xoá hàng", "− Hàng", () => editor.chain().focus().deleteRow().run())}
        {tool("Xoá cột", "− Cột", () => editor.chain().focus().deleteColumn().run())}
        {tool("Xoá bảng", "Xoá bảng", () => editor.chain().focus().deleteTable().run())}
      </div>}
    </>}
    {!parts.error && <div className="max-h-[65vh] overflow-auto" onDoubleClick={() => { if (!editable && canEdit) onEdit(); }}>
      {rawMode && editable ? <textarea aria-label="Mã Markdown của nội dung" value={rawBody} disabled={saving} onChange={(event) => {
        setRawBody(event.target.value); draftBody.current = event.target.value;
        const changed = event.target.value !== parts.body; setDirty(changed); onDirtyChange(changed);
      }} className="min-h-96 w-full resize-y p-5 font-mono text-sm leading-relaxed outline-none" /> : <EditorContent editor={editor} />}
    </div>}
    <p className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">Metadata và quyền truy cập được giữ nguyên. Mỗi lần lưu tăng 1 version; chỉ xoá vector cũ khi embedding bản mới thành công.</p>
    {error && <p role="alert" className="p-4 text-xs text-destructive">{error}</p>}
  </section>;
}
