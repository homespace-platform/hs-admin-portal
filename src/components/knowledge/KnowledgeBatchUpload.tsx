import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminKnowledgeService } from "@/services/admin-knowledge.service";
import type { KnowledgeUploadResult } from "@/types/knowledge.type";
import { getApiErrorMessage } from "@/utils/apiError";

type Row = { file: File; status: string; error?: string; result?: KnowledgeUploadResult };
const labels: Record<string, string> = {
  SELECTED: "Chờ tải lên", UPLOADING: "Đang tải lên", QUEUED: "Chờ worker", RUNNING: "Đang tạo vector",
  COMPLETED: "Đã xử lý", FAILED: "Thất bại",
};

export default function KnowledgeBatchUpload({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const busyPoll = useRef(false);
  const active = rows.some((row) => row.status === "QUEUED" || row.status === "RUNNING");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const poll = async () => {
      if (busyPoll.current) return;
      busyPoll.current = true;
      try {
        const updates = await Promise.all(rows.filter((row) => row.result && ["QUEUED", "RUNNING"].includes(row.status))
          .map(async (row) => {
            try {
              return { jobId: row.result!.jobId, job: await adminKnowledgeService.job(row.result!.jobId) };
            } catch { return null; }
          }));
        if (cancelled) return;
        setRows((current) => current.map((row) => {
          const update = updates.find((item) => item?.jobId === row.result?.jobId);
          return update ? { ...row, status: update.job.status, error: update.job.errorMessage ?? undefined } : row;
        }));
        if (updates.some((item) => item && ["COMPLETED", "FAILED"].includes(item.job.status))) onChanged();
      } finally { busyPoll.current = false; }
    };
    const timer = window.setInterval(() => void poll(), 2500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [active, rows, onChanged]);

  function selectFiles(files: FileList | File[]) {
    if (uploading || active) return;
    const selected = Array.from(files).filter((file) => file.name.toLowerCase() !== "readme.md");
    if (selected.length !== files.length) toast.info("Đã bỏ qua README.md (file hướng dẫn thư mục).");
    if (selected.length > 50) { toast.error("Tối đa 50 file mỗi lần tải lên."); return; }
    setRows(selected.map((file) => ({ file, status: "SELECTED" })));
  }

  async function upload() {
    const selected = rows.filter((row) => row.status === "SELECTED");
    if (!selected.length) return;
    const valid = selected.filter((row) => row.file.name.toLowerCase().endsWith(".md") && row.file.size <= 1024 * 1024);
    setRows((current) => current.map((row) => row.status !== "SELECTED" ? row
      : valid.includes(row) ? { ...row, status: "UPLOADING" }
      : { ...row, status: "FAILED", error: "Chỉ nhận .md UTF-8, tối đa 1 MB/file." }));
    if (!valid.length) return;
    setUploading(true); setProgress(0);
    try {
      const items = await adminKnowledgeService.uploadBatch(valid.map((row) => row.file), setProgress);
      setRows((current) => {
        let index = 0;
        return current.map((row) => {
          if (row.status !== "UPLOADING") return row;
          const item = items[index++];
          return item?.success && item.result ? { ...row, status: item.result.status, result: item.result }
            : { ...row, status: "FAILED", error: item?.error ?? "Không nhận được kết quả upload." };
        });
      });
      onChanged();
      const accepted = items.filter((item) => item.success).length;
      if (!accepted) toast.error("Không có file nào được nhận. Xem lỗi của từng file bên dưới.");
      else if (accepted < items.length) toast.warning(`Đã nhận ${accepted}/${items.length} file; các file còn lại có lỗi riêng.`);
      else toast.success(`Đã nhận ${accepted} file. Tự áp dụng khi worker hoàn tất.`);
    } catch (error) {
      setRows((current) => current.map((row) => row.status === "UPLOADING"
        ? { ...row, status: "FAILED", error: getApiErrorMessage(error, "Không xác nhận được upload. Kiểm tra danh mục trước khi tải lại.") } : row));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return <section className={`space-y-3 rounded-xl border p-4 ${dragging ? "border-primary bg-primary/5" : "bg-card"}`}
    onDragOver={(event) => { event.preventDefault(); if (!uploading && !active) setDragging(true); }}
    onDragLeave={() => setDragging(false)}
    onDrop={(event) => { event.preventDefault(); setDragging(false); selectFiles(event.dataTransfer.files); }}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><FileUp className="h-6 w-6 text-primary" /><div>
        <h2 className="text-sm font-semibold">Kéo thả hoặc chọn nhiều tài liệu Markdown</h2>
        <p className="text-xs text-muted-foreground">Tối đa 50 file, 1 MB/file; cần YAML metadata. Cùng tên file luôn tăng version, kể cả nội dung không đổi.</p>
        <p className="text-xs text-muted-foreground">Tự áp dụng bản mới sau xử lý; bản cũ vẫn phục vụ AI nếu cập nhật chưa thành công.</p>
      </div></div>
      <div className="flex items-center gap-2">
        <input ref={input} id="knowledge-files" type="file" accept=".md,text/markdown" multiple
          disabled={uploading || active} aria-label="Chọn các tài liệu Markdown"
          onChange={(event) => { if (event.target.files) selectFiles(event.target.files); }} className="max-w-60 text-xs" />
        <button type="button" disabled={uploading || active || !rows.some((row) => row.status === "SELECTED")}
          onClick={() => void upload()} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">
          {uploading ? (progress >= 100 ? "Đang chờ API..." : `Đang tải ${progress}%`) : "Upload và áp dụng"}
        </button>
      </div>
    </div>
    {uploading && progress >= 100 && <p role="status" className="text-xs text-muted-foreground">
      File đã gửi xong, đang chờ API lưu tài liệu và tạo hàng đợi. Chưa có nghĩa là worker đã xử lý xong.
    </p>}
    {rows.length > 0 && <ul className="max-h-64 space-y-2 overflow-y-auto text-xs" aria-live="polite">
      {rows.map((row, index) => <li key={`${row.file.name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-2">
        <span className="break-all">{row.file.name}{row.result && ` · v${row.result.version}`}</span>
        <span className={`inline-flex items-center gap-1 ${row.status === "FAILED" ? "text-destructive" : "text-muted-foreground"}`}>
          {["UPLOADING", "QUEUED", "RUNNING"].includes(row.status) && <Loader2 className="h-3 w-3 animate-spin" />}
          {row.status === "UPLOADING" && progress >= 100 ? "Chờ API xác nhận" : labels[row.status] ?? row.status}
        </span>
        {row.error && <p className="w-full text-destructive">{row.error}</p>}
      </li>)}
    </ul>}
  </section>;
}
