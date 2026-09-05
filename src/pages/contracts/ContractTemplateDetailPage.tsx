import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Plus,
  Layers,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Clock,
  ShieldCheck,
  Eye,
  FileCode2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { adminContractService } from "@/services/admin-contract.service";
import storageService from "@/services/storage.service";
import type {
  ContractTemplateResponse,
  ContractTemplateVersionResponse,
} from "@/types/contract.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ContractTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<ContractTemplateResponse | null>(null);
  const [versions, setVersions] = useState<ContractTemplateVersionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal thêm version mới
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadData(templateId);
    }
  }, [templateId]);

  const loadData = async (id: string) => {
    setLoading(true);
    try {
      const [tData, vData] = await Promise.all([
        adminContractService.getTemplate(id),
        adminContractService.getVersions(id),
      ]);
      setTemplate(tData);
      setVersions(vData || []);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể tải thông tin mẫu hợp đồng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) {
      toast.error("Vui lòng chọn file Word (.docx)");
      return;
    }
    if (!templateId) return;

    setIsSubmitting(true);
    try {
      toast.info("Đang tải file Word lên...");
      const storageId = await storageService.uploadContractDocx(newFile);

      toast.info("Đang phân tích cú pháp mã trường...");
      await adminContractService.createVersion(templateId, {
        storageObjectId: storageId,
        originalFileName: newFile.name,
      });

      toast.success("Thêm phiên bản mới thành công!");
      setIsNewVersionModalOpen(false);
      setNewFile(null);
      loadData(templateId);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Lỗi khi thêm phiên bản mới: " + err.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (versionId: string, verNumber: number) => {
    if (!templateId) return;
    if (!window.confirm(`Bạn có chắc muốn xuất bản Phiên bản ${verNumber}? Phiên bản này sẽ có hiệu lực ngay cho các hợp đồng mới.`)) {
      return;
    }

    try {
      await adminContractService.publishVersion(templateId, versionId);
      toast.success(`Đã xuất bản Phiên bản ${verNumber} thành công!`);
      loadData(templateId);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể xuất bản phiên bản này"
      );
    }
  };

  const handleTestPreview = async (versionId: string, verNumber: number) => {
    if (!templateId) return;
    setPreviewLoading(true);
    toast.info(`Đang tạo bản xem thử cho Phiên bản ${verNumber}...`);

    try {
      const { blob, filename, contentType } = await adminContractService.testPreviewVersion(
        templateId,
        versionId
      );

      const isPdf = contentType.includes("application/pdf");
      const url = URL.createObjectURL(blob);

      if (isPdf) {
        setPreviewUrl(url);
        setIsPreviewModalOpen(true);
        toast.success("Đã tạo bản xem thử PDF thành công!");
      } else {
        // Tự động tải file DOCX
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Đã xuất file Word xem thử thành công!");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Lỗi khi tạo bản xem thử: " + err.message
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Đang tải thông tin mẫu hợp đồng...
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Không tìm thấy mẫu hợp đồng.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/contracts/templates")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-2 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách mẫu
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileCode2 className="w-6 h-6 text-primary" />
            {template.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {template.description || "Không có mô tả chi tiết."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/contracts/fields" target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              Từ điển mã trường
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsNewVersionModalOpen(true)}
            className="gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Thêm phiên bản Word mới
          </Button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Loại BĐS</div>
          <div className="text-sm font-bold text-foreground mt-1">
            {template.category || "Dùng chung cho tất cả"}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Hình thức thuê</div>
          <div className="text-sm font-bold text-foreground mt-1">
            {template.rentalMode === "WHOLE_UNIT"
              ? "Nguyên căn"
              : template.rentalMode === "PARTIAL"
              ? "Một phần / Phòng"
              : "Tất cả"}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Tổng số phiên bản</div>
          <div className="text-sm font-bold text-foreground mt-1">
            {versions.length} phiên bản
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Trạng thái</div>
          <div className="mt-1">
            {template.status === "ACTIVE" ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                Đang hoạt động
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Đã lưu trữ</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Versions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Lịch sử các phiên bản file Word
          </h2>
          <span className="text-xs text-muted-foreground">
            Sắp xếp từ phiên bản mới nhất
          </span>
        </div>

        {versions.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl bg-card text-muted-foreground text-xs">
            Chưa có phiên bản Word nào được tạo.
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => {
              const isPublished = v.status === "PUBLISHED";
              const isDraft = v.status === "DRAFT";
              const hasWarnings = v.validationWarnings && v.validationWarnings.length > 0;

              return (
                <div
                  key={v.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all bg-card ${
                    isPublished
                      ? "border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20"
                      : "border-border shadow-xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                          isPublished
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-foreground">
                            Phiên bản {v.versionNumber}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({v.originalFileName || "template.docx"})
                          </span>

                          {isPublished ? (
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                              Đang có hiệu lực (PUBLISHED)
                            </Badge>
                          ) : isDraft ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px]">
                              Bản nháp (DRAFT)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                              Đã thay thế (DEPRECATED)
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Tạo: {new Date(v.createdAt).toLocaleString("vi-VN")}
                          </span>
                          {v.publishedAt && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Xuất bản: {new Date(v.publishedAt).toLocaleString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={previewLoading}
                        onClick={() => handleTestPreview(v.id, v.versionNumber)}
                        className="gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                        title="Tạo bản xem trước với dữ liệu giả lập để kiểm tra bố cục"
                      >
                        <Play className="w-3.5 h-3.5 fill-primary" />
                        Xem thử (Test Preview)
                      </Button>

                      {!isPublished && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handlePublish(v.id, v.versionNumber)}
                          className="gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          title="Áp dụng phiên bản này cho các hợp đồng tạo mới"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Xuất bản (Publish)
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Placeholders & Warnings summary */}
                  <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Mã trường phát hiện:</span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {v.placeholders?.length || 0} trường
                        </Badge>
                      </div>

                      {hasWarnings ? (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{v.validationWarnings.length} cảnh báo mã trường</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Toàn bộ mã trường đều hợp lệ
                        </div>
                      )}
                    </div>

                    {/* Collapsible tags peek */}
                    {v.placeholders && v.placeholders.length > 0 && (
                      <div className="flex items-center gap-1 overflow-x-auto max-w-md py-0.5">
                        {v.placeholders.slice(0, 5).map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-mono text-muted-foreground shrink-0"
                          >
                            &#123;&#123;{p}&#125;&#125;
                          </span>
                        ))}
                        {v.placeholders.length > 5 && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            +{v.placeholders.length - 5} nữa
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Warning Details if any */}
                  {hasWarnings && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Cảnh báo phân tích từ hệ thống:
                      </div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800 dark:text-amber-200">
                        {v.validationWarnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm Version Mới */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Thêm phiên bản Word mới (v{versions.length + 1})
              </h3>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsNewVersionModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Chọn file Word (.docx) đã sửa đổi điều khoản
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary/50 transition-colors bg-muted/20">
                  <input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="new-version-file"
                  />
                  <label
                    htmlFor="new-version-file"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    {newFile ? (
                      <div className="text-xs font-bold text-primary truncate max-w-xs">
                        {newFile.name} ({(newFile.size / 1024).toFixed(1)} KB)
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-foreground">
                          Nhấn để chọn file Word (.docx)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Hệ thống sẽ phân tích lại tất cả các thẻ placeholder
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setIsNewVersionModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="font-semibold gap-1.5"
                >
                  {isSubmitting ? "Đang xử lý..." : "Tải lên & Phân tích"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Test Preview PDF */}
      {isPreviewModalOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[85vh] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Bản xem thử hợp đồng mẫu (Dữ liệu giả định Dummy Data)
              </h3>
              <div className="flex items-center gap-2">
                <a href={previewUrl} download="test_preview.pdf">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Download className="w-3 h-3" /> Tải về máy
                  </Button>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-muted/40 p-2">
              <iframe
                src={previewUrl}
                title="Bản xem thử PDF"
                className="w-full h-full rounded-xl border border-border bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
