// Vite-only test harness. Uses in-memory data; never uploads or alters real RAG documents.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import KnowledgeMarkdownEditor from "../src/components/knowledge/KnowledgeMarkdownEditor";
import { adminKnowledgeService } from "../src/services/admin-knowledge.service";
import "../src/index.css";

let current = { documentId: "ui-test", sourceFilename: "ui-test.md", version: "1", versionId: "version-1",
  markdown: "---\ndocument_id: ui-test\ntitle: Giới thiệu HomeSpace\nvisibility: admin\naudience: [admin]\nversion: 1\n---\n\n# Giới thiệu HomeSpace\n\nHomeSpace hỗ trợ **người thuê** tìm phòng và đặt lịch xem nhà.\n\n## Các bước sử dụng\n\n1. Tìm tin đăng phù hợp.\n2. Liên hệ và đặt lịch.\n\n> Đọc kỹ thông tin trước khi xác nhận.\n\n| Nội dung | Trạng thái |\n| --- | --- |\n| Xem phòng | Sẵn sàng |\n" };
adminKnowledgeService.content = async () => ({ ...current });
adminKnowledgeService.updateContent = async (_id, markdown, expected) => {
  if (expected !== current.versionId) throw new Error("Version conflict");
  const version = String(Number(current.version) + 1);
  current = { ...current, markdown, version, versionId: `version-${version}` };
  return { ...current, title: "Giới thiệu HomeSpace", status: "QUEUED", jobId: "mock-job", visibility: "admin", isNewVersion: true };
};

function Preview() {
  const [editing, setEditing] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState("");
  return <main className="mx-auto max-w-5xl space-y-4 p-6">
    <h1 className="text-xl font-semibold">Kiểm thử editor — dữ liệu giả, không gọi CSDL</h1>
    <KnowledgeMarkdownEditor key={revision} documentId="ui-test" canEdit editable={editing}
      onEdit={() => setEditing(true)} onClose={() => setEditing(false)}
      onDirtyChange={() => {}} onSavingChange={() => {}}
      onSaved={(result) => { setEditing(false); setRevision((value) => value + 1); setSaved(`Đã lưu v${result.version}; metadata admin được giữ nguyên.`); }} />
    {saved && <p role="status">{saved}</p>}
  </main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
