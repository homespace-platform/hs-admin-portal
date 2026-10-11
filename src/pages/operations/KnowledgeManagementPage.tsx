import { lazy, Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  Copy,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { adminKnowledgeService } from "@/services/admin-knowledge.service";
import type {
  KnowledgeDocument,
  KnowledgeDocumentDetail,
  KnowledgeJob,
  KnowledgeSearchResult,
  TestAskResult,
  WorkerHealthResult,
} from "@/types/knowledge.type";
import { getApiErrorMessage } from "@/utils/apiError";
import KnowledgeBatchUpload from "@/components/knowledge/KnowledgeBatchUpload";
const KnowledgeMarkdownEditor = lazy(() => import("@/components/knowledge/KnowledgeMarkdownEditor"));

const formatDate = (value: string) => new Date(value).toLocaleString("vi-VN");

type FilterTab = "all" | "active" | "draft" | "processing" | "failed" | "archived";

export default function KnowledgeManagementPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchFilter, setSearchFilter] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<KnowledgeDocumentDetail | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [editingMarkdown, setEditingMarkdown] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorReload, setEditorReload] = useState(0);

  const [workerHealth, setWorkerHealth] = useState<WorkerHealthResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<KnowledgeJob | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Metadata editing
  const [showMetadataEdit, setShowMetadataEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "admin">("public");
  const [editAudience, setEditAudience] = useState("");

  // Test QA / Quality check
  const [testQuery, setTestQuery] = useState("");
  const [testScope, setTestScope] = useState<"public" | "admin">("public");
  const [testResult, setTestResult] = useState<TestAskResult | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<KnowledgeSearchResult | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadWorkerHealth = useCallback(async () => {
    try {
      const health = await adminKnowledgeService.workerHealth();
      setWorkerHealth(health);
    } catch {
      setWorkerHealth({
        status: "OFFLINE",
        activeWorkers: 0,
        workers: [],
        message: "Không kiểm tra được trạng thái worker.",
      });
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const page = await adminKnowledgeService.list(offset, 50);
      setDocuments(page.items);
      setTotal(page.total);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được danh sách tài liệu."));
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const value = await adminKnowledgeService.detail(id);
      setDetail(value);
      setEditTitle(value.title);
      setEditCategory(value.category ?? "");
      setEditVisibility(value.visibility);
      setEditAudience(value.audience.join(", "));
      if (value.latestJob && ["QUEUED", "RUNNING"].includes(value.latestJob.status)) {
        setJobId(value.latestJob.jobId);
        setJob(value.latestJob);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được chi tiết tài liệu."));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void adminKnowledgeService.list(offset, 50)
      .then((page) => {
        if (cancelled) return;
        setDocuments(page.items);
        setTotal(page.total);
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Không tải được danh sách tài liệu."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [offset]);

  useEffect(() => {
    let cancelled = false;
    void adminKnowledgeService.workerHealth()
      .then((health) => { if (!cancelled) setWorkerHealth(health); })
      .catch(() => {
        if (!cancelled) setWorkerHealth({
          status: "OFFLINE", activeWorkers: 0, workers: [],
          message: "Không kiểm tra được trạng thái worker.",
        });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void adminKnowledgeService
      .detail(selectedId)
      .then((value) => {
        if (!cancelled) {
          setDetail(value);
          setEditTitle(value.title);
          setEditCategory(value.category ?? "");
          setEditVisibility(value.visibility);
          setEditAudience(value.audience.join(", "));
          setJob(value.latestJob);
          setJobId(value.latestJob && ["QUEUED", "RUNNING"].includes(value.latestJob.status) ? value.latestJob.jobId : null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Không tải được chi tiết tài liệu."));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Polling active job
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: number | null = null;

    const poll = async () => {
      try {
        const next = await adminKnowledgeService.job(jobId);
        if (cancelled) return;
        setJob(next);
        if (next.status === "COMPLETED" || next.status === "FAILED") {
          void loadDocuments();
          void loadWorkerHealth();
          if (selectedId) void loadDetail(selectedId);
          if (next.status === "COMPLETED") {
            toast.success("Đã xử lý xong tài liệu. Phiên bản AI đang dùng được hiển thị bên dưới.");
          } else {
            toast.error(`Xử lý tài liệu thất bại: ${next.errorMessage ?? "Lỗi không xác định"}`);
          }
          if (timer) window.clearInterval(timer);
        }
      } catch {
        // Silently tolerate transient polling error
      }
    };

    void poll();
    timer = window.setInterval(poll, 2500);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [jobId, selectedId, loadDocuments, loadDetail, loadWorkerHealth]);

  const handleKnowledgeChanged = useCallback(() => {
    void loadDocuments();
    if (selectedId) void loadDetail(selectedId);
  }, [loadDocuments, loadDetail, selectedId]);

  async function handlePrimaryAction(action: "approve" | "publish" | "reindex" | "archive") {
    if (!selectedId) return;
    if (editingMarkdown || editorSaving) {
      toast.info("Hãy lưu hoặc huỷ chỉnh sửa tài liệu trước khi thực hiện thao tác này.");
      return;
    }

    if (action === "archive" && !window.confirm(`Ẩn tài liệu "${detail?.title || selectedId}" khỏi AI?`)) {
      return;
    }

    setBusy(true);
    try {
      if (action === "approve") {
        await adminKnowledgeService.approve(selectedId);
        toast.success("Đã duyệt nội dung! Bạn có thể xuất bản để AI sử dụng.");
      } else if (action === "publish" || action === "reindex") {
        const id =
          action === "publish"
            ? await adminKnowledgeService.publish(selectedId)
            : await adminKnowledgeService.reindex(selectedId);
        setJob(null);
        setJobId(id);
        toast.info("Đã gửi yêu cầu xuất bản. Đang tiến hành tạo vector...");
        void loadWorkerHealth();
      } else if (action === "archive") {
        await adminKnowledgeService.archive(selectedId);
        toast.success("Đã đưa tài liệu vào kho lưu trữ (AI sẽ không sử dụng).");
      }
      await Promise.all([loadDocuments(), loadDetail(selectedId)]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Thao tác thất bại."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !editTitle.trim()) return;
    setBusy(true);
    try {
      await adminKnowledgeService.updateDraftMetadata(selectedId, {
        title: editTitle.trim(),
        category: editCategory.trim(),
        visibility: editVisibility,
        audience: editAudience.split(",").map((v) => v.trim()).filter(Boolean),
      });
      toast.success("Đã lưu thông tin tài liệu.");
      setShowMetadataEdit(false);
      await Promise.all([loadDetail(selectedId), loadDocuments()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được thông tin."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRunTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!testQuery.trim()) return;
    setTesting(true);
    setTestResult(null);
    setDiagnosticResult(null);
    try {
      const [answerData, searchData] = await Promise.all([
        adminKnowledgeService.testAsk(testQuery.trim(), testScope),
        adminKnowledgeService.search(testQuery.trim(), testScope),
      ]);
      setTestResult(answerData);
      setDiagnosticResult(searchData);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Thử nghiệm câu hỏi thất bại."));
    } finally {
      setTesting(false);
    }
  }

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    // Search query filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchId = doc.documentId.toLowerCase().includes(q);
      const matchCat = (doc.category ?? "").toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchCat) return false;
    }

    if (activeTab === "active") return doc.activeVersionId !== null && doc.status !== "ARCHIVED";
    if (activeTab === "draft") return doc.latestVersionStatus === "DRAFT";
    if (activeTab === "archived") return doc.status === "ARCHIVED";
    if (activeTab === "processing") return ["APPROVED", "PUBLISHING"].includes(doc.latestVersionStatus ?? "");
    if (activeTab === "failed") return doc.latestVersionStatus === "FAILED";
    return true;
  });

  const latestVersion = detail?.versions[0];
  const activeJob = job || detail?.latestJob;
  const isJobRunning = activeJob?.status === "QUEUED" || activeJob?.status === "RUNNING";

  return (
    <div className="space-y-6 p-6">
      {/* 1. Header & Worker Health Notice */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <BookOpen className="h-7 w-7 text-primary" /> Kho tri thức AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý tài liệu hướng dẫn và chính sách HomeSpace. Chỉ tài liệu đã xuất bản thành công mới được AI sử dụng để trả lời người dùng.
          </p>
        </div>

        {/* Worker health badge */}
        <div className="flex items-center gap-2">
          {workerHealth?.status === "HEALTHY" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Tiến trình AI (Worker): Đang chạy ({workerHealth.activeWorkers})
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Tiến trình AI (Worker): Chưa chạy
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadDocuments();
              void loadWorkerHealth();
            }}
            aria-label="Làm mới trạng thái"
            className="rounded-lg border bg-background p-2 text-muted-foreground hover:bg-muted"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Prominent alert if worker is offline */}
      {workerHealth?.status === "OFFLINE" && (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 p-4 text-amber-900 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold">Tiến trình nhúng AI (Worker) hiện đang tắt</p>
              <p className="text-amber-800 dark:text-amber-300">
                Khi xuất bản hoặc cập nhật tài liệu, hệ thống cần worker chạy ở nền để chia nhỏ đoạn văn và tạo vector tra cứu cục bộ.
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-background/80 p-2 font-mono text-xs text-foreground">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 select-all">uv run python -m homespace_ai.knowledge.ingestion.worker</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText("uv run python -m homespace_ai.knowledge.ingestion.worker");
                    toast.success("Đã chép lệnh khởi động worker!");
                  }}
                  className="rounded p-1 hover:bg-muted"
                  title="Sao chép lệnh"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Upload Document Card */}
      <KnowledgeBatchUpload onChanged={handleKnowledgeChanged} />

      {/* 3. Main Workspace: Document List & Detail View */}
      <div className="grid gap-6 xl:grid-cols-[minmax(340px,1fr)_minmax(460px,1.4fr)]">
        {/* Left Column: Documents Directory */}
        <section className="flex flex-col rounded-xl border bg-card p-4 shadow-2xs">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Danh mục tài liệu ({filteredDocuments.length})</h2>
            <div className="text-xs text-muted-foreground">Tổng: {total}</div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-3 flex flex-wrap gap-1.5 border-b pb-3">
            {[
              { id: "all", label: "Tất cả" },
              { id: "active", label: "Đang dùng cho AI" },
              { id: "draft", label: "Cần duyệt" },
              { id: "processing", label: "Đang xử lý" },
              { id: "failed", label: "Lỗi xử lý" },
              { id: "archived", label: "Lưu trữ" },
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search in List */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã tài liệu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-3 text-xs focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Document list cards */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[580px] pr-1">
            {loading && <p className="py-8 text-center text-sm text-muted-foreground">Đang tải danh sách tài liệu...</p>}
            {!loading && filteredDocuments.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Không có tài liệu nào trong mục này.</p>
              </div>
            )}
            {filteredDocuments.map((doc) => {
              const isSelected = selectedId === doc.documentId;
              const isAiActive = doc.activeVersionId !== null && doc.status !== "ARCHIVED";

              return (
                <button
                  type="button"
                  key={doc.documentId}
                  onClick={() => {
                    if (editorSaving || selectedId === doc.documentId) return;
                    if (editorDirty && !window.confirm("Chuyển tài liệu và bỏ các chỉnh sửa chưa lưu?")) return;
                    setEditingMarkdown(false);
                    setEditorDirty(false);
                    setDetail(null);
                    setJob(null);
                    setJobId(null);
                    setSelectedId(doc.documentId);
                  }}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all hover:bg-muted/50 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-border/70 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm leading-snug line-clamp-1">{doc.title}</span>
                    {doc.visibility === "admin" ? (
                      <span className="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        Nội bộ Admin
                      </span>
                    ) : (
                      <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        Công khai
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-all text-[11px] text-muted-foreground">{doc.sourceFilename ?? doc.documentId} · v{doc.latestVersion ?? "—"}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {isAiActive ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Đang phục vụ AI
                      </span>
                    ) : ["APPROVED", "PUBLISHING"].includes(doc.latestVersionStatus ?? "") ? (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3" /> Đang chờ xử lý
                      </span>
                    ) : (
                      <span className="text-muted-foreground/80">Bản nháp</span>
                    )}
                    {doc.category && <span>· {doc.category}</span>}
                    {doc.latestVersionStatus === "FAILED" && <span className="text-destructive">· Bản mới xử lý lỗi</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
            <button type="button" disabled={offset === 0 || loading} onClick={() => { setLoading(true); setOffset(Math.max(0, offset - 50)); }}
              className="rounded border px-3 py-1 disabled:opacity-40">Trang trước</button>
            <span>{total ? offset + 1 : 0}–{Math.min(offset + documents.length, total)} / {total}</span>
            <button type="button" disabled={offset + 50 >= total || loading} onClick={() => { setLoading(true); setOffset(offset + 50); }}
              className="rounded border px-3 py-1 disabled:opacity-40">Trang sau</button>
          </div>
        </section>

        {/* Right Column: Selected Document Detail & Human-Centric Flow */}
        <section className="flex flex-col rounded-xl border bg-card p-5 shadow-2xs">
          {!detail ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Chọn một tài liệu bên trái để mở và chỉnh sửa Markdown</p>
              <p className="text-xs text-muted-foreground/80">
                Cập nhật sẽ tăng version và tự thay dữ liệu vector sau khi xử lý thành công.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Document Title & Meta Badges */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold leading-tight">{detail.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-[11px]">{detail.documentId}</span>
                    <span>·</span>
                    <span>Phạm vi: {detail.visibility === "admin" ? "Quản trị viên" : "Người dùng công khai"}</span>
                    <span>·</span>
                    <span>Cập nhật: {formatDate(detail.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2"><button type="button" disabled={detail.status === "ARCHIVED" || busy || editorSaving || editingMarkdown}
                  onClick={() => { setPreviewMarkdown(true); setEditingMarkdown(true); }}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40">
                  Chỉnh sửa nội dung
                </button><button
                  type="button"
                  disabled={editingMarkdown || editorSaving}
                  onClick={() => setPreviewMarkdown(!previewMarkdown)}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {previewMarkdown ? "Đóng xem trước" : "Xem tài liệu"}
                </button>
                </div>
              </div>

              {/* Status Indicator Cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* AI serving status */}
                <div className="rounded-xl border bg-muted/30 p-3.5">
                  <div className="text-xs text-muted-foreground">Phiên bản AI đang dùng</div>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-sm">
                    {detail.activeVersion ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Phiên bản v{detail.activeVersion.version}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-muted-foreground/60" />
                        <span className="text-muted-foreground">Chưa có phiên bản nào phục vụ AI</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Latest version status */}
                <div className="rounded-xl border bg-muted/30 p-3.5">
                  <div className="text-xs text-muted-foreground">Bản mới nhất vừa cập nhật</div>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-sm">
                    <span>v{latestVersion?.version ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      ({latestVersion?.status === "PUBLISHED"
                        ? "Đã sẵn sàng"
                        : latestVersion?.status === "APPROVED"
                        ? "Đã nhận, chờ xử lý"
                        : latestVersion?.status === "DRAFT"
                        ? "Bản nháp (Cần duyệt)"
                        : latestVersion?.status === "FAILED"
                        ? "Có lỗi xử lý"
                        : latestVersion?.status ?? "—"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Ingestion Job Banner if running */}
              {isJobRunning && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold text-sm">Đang tạo vector embedding cho AI...</span>
                    <p className="mt-0.5 text-muted-foreground">
                      Hệ thống đang chia nhỏ nội dung và tính toán vector trên worker. Khi hoàn tất, phiên bản này sẽ tự động được AI sử dụng.
                    </p>
                  </div>
                </div>
              )}

              {/* Failed Job Banner if error */}
              {activeJob?.status === "FAILED" && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-sm">Xử lý tài liệu không thành công</span>
                      <p>{activeJob.errorMessage || "Lỗi xử lý embedding trên worker."}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Call To Action (ONE clear button per state) */}
              <div className="rounded-xl border bg-background p-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Thao tác tiếp theo:</div>
                <div className="flex flex-wrap items-center gap-3">
                  {latestVersion?.status === "DRAFT" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handlePrimaryAction("approve")}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-2xs hover:opacity-90 disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Duyệt nội dung này
                    </button>
                  )}

                  {latestVersion?.status === "APPROVED" && (
                    <button
                      type="button"
                      disabled={busy || isJobRunning}
                      onClick={() => void handlePrimaryAction("publish")}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-2xs hover:opacity-90 disabled:opacity-40"
                    >
                      {isJobRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang xử lý xuất bản...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Xuất bản cho AI sử dụng
                        </>
                      )}
                    </button>
                  )}

                  {latestVersion?.status === "FAILED" && (
                    <button
                      type="button"
                      disabled={busy || isJobRunning}
                      onClick={() => void handlePrimaryAction("publish")}
                      className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-rose-700 disabled:opacity-40"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Thử lại xuất bản
                    </button>
                  )}

                  {latestVersion?.status === "PUBLISHED" && (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("test-ai-section");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20"
                    >
                      <Sparkles className="h-4 w-4" />
                      Thử hỏi AI với tài liệu này
                    </button>
                  )}

                  {/* Secondary / Advanced actions */}
                  <div className="ml-auto flex items-center gap-2">
                    {detail.activeVersionId && (
                      <button
                        type="button"
                        disabled={busy || isJobRunning}
                        onClick={() => {
                          if (window.confirm("Tạo lại toàn bộ vector embedding cho tài liệu này?")) {
                            void handlePrimaryAction("reindex");
                          }
                        }}
                        className="rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                        title="Tính toán lại vector từ văn bản hiện tại"
                      >
                        Tạo lại vector (Reindex)
                      </button>
                    )}

                    {latestVersion?.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => setShowMetadataEdit(!showMetadataEdit)}
                        className="rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Sửa thông tin
                      </button>
                    )}

                    {detail.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        disabled={busy || editorSaving || editingMarkdown}
                        onClick={() => void handlePrimaryAction("archive")}
                        className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40"
                        title="Ẩn tài liệu khỏi AI"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit metadata inline */}
                {showMetadataEdit && (
                  <form onSubmit={handleSaveMetadata} className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 text-xs">
                    <label className="sm:col-span-2">
                      Tiêu đề hiển thị
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-xs"
                      />
                    </label>
                    <label>
                      Danh mục
                      <input
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-xs"
                      />
                    </label>
                    <label>
                      Phạm vi truy cập
                      <select
                        value={editVisibility}
                        onChange={(e) => setEditVisibility(e.target.value as "public" | "admin")}
                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-xs"
                      >
                        <option value="public">Công khai (Public)</option>
                        <option value="admin">Nội bộ Quản trị (Admin)</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={busy}
                      className="sm:col-span-2 rounded-lg bg-primary py-2 font-semibold text-primary-foreground"
                    >
                      Lưu thông tin
                    </button>
                  </form>
                )}
              </div>

              {(previewMarkdown || editingMarkdown) && <Suspense fallback={<p className="text-sm text-muted-foreground">Đang tải trình soạn thảo...</p>}><KnowledgeMarkdownEditor
                key={`${detail.documentId}:${editorReload}`} documentId={detail.documentId}
                editable={editingMarkdown} canEdit={detail.status !== "ARCHIVED" && !busy}
                onEdit={() => setEditingMarkdown(true)} onClose={() => setEditingMarkdown(false)}
                onDirtyChange={setEditorDirty} onSavingChange={setEditorSaving}
                onSaved={(result) => {
                  setEditingMarkdown(false); setEditorDirty(false); setJob(null); setJobId(result.jobId);
                  setEditorReload((value) => value + 1);
                  handleKnowledgeChanged();
                }} /></Suspense>}
            </div>
          )}
        </section>
      </div>

      {/* 4. Quality Test Section ("Thử một câu hỏi") */}
      <section id="test-ai-section" className="rounded-xl border bg-card p-5 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Thử nghiệm hỏi đáp AI</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Thử đặt câu hỏi như một người dùng hoặc quản trị viên để kiểm tra câu trả lời, độ chính xác của tài liệu và các trích dẫn được sinh ra.
        </p>

        <form onSubmit={handleRunTest} className="mt-4 flex flex-wrap gap-2.5">
          <input
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            maxLength={500}
            placeholder="Nhập câu hỏi thử nghiệm, ví dụ: HomeSpace là nền tảng gì và dành cho ai?..."
            className="min-w-[280px] flex-1 rounded-lg border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-hidden"
          />
          <select
            value={testScope}
            onChange={(e) => setTestScope(e.target.value as "public" | "admin")}
            className="rounded-lg border bg-background px-3 py-2 text-xs font-medium"
          >
            <option value="public">Vai trò: Khách công khai (Public)</option>
            <option value="admin">Vai trò: Quản trị viên (Admin)</option>
          </select>
          <button
            type="submit"
            disabled={testing || !testQuery.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Kiểm tra câu trả lời
              </>
            )}
          </button>
        </form>

        {/* Test QA Response */}
        {testResult && (
          <div className="mt-5 space-y-4 rounded-xl border bg-muted/20 p-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Câu trả lời từ AI
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    testResult.status === "ANSWERED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {testResult.status}
                </span>
              </div>
              <div className="mt-2 whitespace-pre-wrap rounded-lg bg-background p-4 text-sm leading-relaxed border">
                {testResult.answer}
              </div>
            </div>

            {/* Verified Citations */}
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Nguồn tài liệu thực sự được trích dẫn ({testResult.citations.length}):
              </span>
              {testResult.citations.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground italic">Không có nguồn nào được trích dẫn.</p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {testResult.citations.map((c) => (
                    <div key={c.chunkId} className="rounded-lg border bg-background p-3 text-xs">
                      <div className="font-semibold text-foreground">{c.title}</div>
                      <div className="text-muted-foreground mt-0.5">{c.heading} (v{c.version})</div>
                      {c.snippet && (
                        <div className="mt-2 rounded bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
                          "{c.snippet}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Technical Inspection Toggle */}
            <div className="border-t pt-3">
              <button
                type="button"
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Code className="h-3.5 w-3.5" />
                {showTechDetails ? "Ẩn chi tiết kỹ thuật (Retrieval Chunks)" : "Xem chi tiết kỹ thuật (Retrieval Chunks)"}
                {showTechDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showTechDetails && diagnosticResult && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Tìm thấy {diagnosticResult.count} đoạn ứng viên từ pgvector & full-text search:
                  </p>
                  {diagnosticResult.results.map((item) => (
                    <div key={`${item.documentId}-${item.chunkIndex}`} className="rounded-lg border bg-background p-3 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span>{item.title} · {item.headingPath}</span>
                        <span className="font-mono text-[11px] text-primary">
                          Độ tương đồng: {item.similarity.toFixed(3)}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[11px] text-muted-foreground">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
