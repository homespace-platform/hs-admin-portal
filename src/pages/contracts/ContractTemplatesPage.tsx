import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  BookOpen,
  Archive,
  Eye,
  Layers,
  Upload,
  FileCode2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { adminContractService } from "@/services/admin-contract.service";
import storageService from "@/services/storage.service";
import type {
  ContractTemplateResponse,
} from "@/types/contract.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORY_LABELS: Record<string, string> = {
  APARTMENT: "Căn hộ",
  HOUSE: "Nhà riêng",
  OFFICE: "Văn phòng",
  COMMERCIAL_SPACE: "Mặt bằng kinh doanh",
  ROOM: "Phòng trọ",
};

export default function ContractTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ContractTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modal tạo mẫu mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createRentalMode, setCreateRentalMode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await adminContractService.listTemplates();
      setTemplates(list || []);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể tải danh sách mẫu hợp đồng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      toast.error("Vui lòng nhập tên mẫu hợp đồng");
      return;
    }
    if (!selectedFile) {
      toast.error("Vui lòng chọn file mẫu Word (.docx)");
      return;
    }
    if (!selectedFile.name.endsWith(".docx")) {
      toast.error("Định dạng file không hỗ trợ. Vui lòng chọn file có đuôi .docx");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload file docx lên S3
      toast.info("Đang tải file mẫu Word lên hệ thống...");
      const storageId = await storageService.uploadContractDocx(selectedFile);

      // 2. Tạo template + version 1
      toast.info("Đang phân tích các mã trường trong file Word...");
      const created = await adminContractService.createTemplate({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        category: createCategory || undefined,
        rentalMode: createRentalMode || undefined,
        storageObjectId: storageId,
        originalFileName: selectedFile.name,
      });

      toast.success("Tạo mẫu hợp đồng thành công!");
      setIsCreateModalOpen(false);
      setCreateName("");
      setCreateDesc("");
      setCreateCategory("");
      setCreateRentalMode("");
      setSelectedFile(null);
      loadTemplates();

      // Chuyển hướng tới trang chi tiết phiên bản vừa tạo
      navigate(`/contracts/templates/${created.id}`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Lỗi khi tạo mẫu hợp đồng: " + err.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn lưu trữ mẫu "${name}"? Mẫu này sẽ không còn hiển thị cho chủ nhà chọn.`)) {
      return;
    }
    try {
      await adminContractService.archiveTemplate(id);
      toast.success("Đã lưu trữ mẫu hợp đồng");
      loadTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể lưu trữ mẫu hợp đồng");
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL" || t.status === statusFilter;

      const matchCategory =
        categoryFilter === "ALL" || t.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [templates, search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <FileCode2 className="w-6 h-6 text-primary" />
            Quản lý mẫu hợp đồng thuê nhà
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các mẫu Word (.docx), phân tích cú pháp mã trường và phát hành phiên bản cho chủ nhà
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/contracts/fields">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <BookOpen className="w-4 h-4 text-primary" />
              Từ điển mã trường
            </Button>
          </Link>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tạo mẫu hợp đồng mới
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên mẫu, mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-input bg-background font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="ARCHIVED">Đã lưu trữ</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-input bg-background font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả loại BĐS</option>
            <option value="APARTMENT">Căn hộ</option>
            <option value="HOUSE">Nhà riêng</option>
            <option value="ROOM">Phòng trọ</option>
            <option value="OFFICE">Văn phòng</option>
            <option value="COMMERCIAL_SPACE">Mặt bằng kinh doanh</option>
          </select>
        </div>
      </div>

      {/* Templates Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tên mẫu hợp đồng</th>
                <th className="py-3 px-4">Loại BĐS áp dụng</th>
                <th className="py-3 px-4">Hình thức thuê</th>
                <th className="py-3 px-4 text-center">Số phiên bản</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Cập nhật</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Đang tải danh sách mẫu hợp đồng...
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Không có mẫu hợp đồng nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((item) => {
                  const isActive = item.status === "ACTIVE";
                  const hasPublished = Boolean(item.latestPublishedVersionId);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              to={`/contracts/templates/${item.id}`}
                              className="hover:text-primary hover:underline font-bold text-sm block"
                            >
                              {item.name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.description || "Không có mô tả"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.category ? (
                          <Badge variant="outline" className="text-[10px]">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Dùng chung</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.rentalMode === "WHOLE_UNIT" ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Nguyên căn
                          </Badge>
                        ) : item.rentalMode === "PARTIAL" ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Một phần
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Tất cả</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-bold text-foreground">
                          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.versionsCount}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          hasPublished ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 text-[10px]">
                              Đã xuất bản
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px]">
                              Bản nháp (chưa publish)
                            </Badge>
                          )
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                            Đã lưu trữ
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/contracts/templates/${item.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs font-semibold gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Chi tiết & Phiên bản
                            </Button>
                          </Link>

                          {isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(item.id, item.name)}
                              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Lưu trữ mẫu này"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Mẫu Hợp Đồng Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Tạo mẫu hợp đồng mới
              </h3>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3.5 text-xs">
              {/* Tên mẫu */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Tên mẫu hợp đồng <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ví dụ: Hợp đồng thuê căn hộ chung cư chuẩn 2026"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Mô tả */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Mô tả mục đích sử dụng
                </label>
                <textarea
                  rows={2}
                  placeholder="Áp dụng cho căn hộ, chung cư cao cấp có phụ lục phụ phí và nội thất..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              {/* Phân loại BĐS & Hình thức */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Loại BĐS áp dụng</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full p-2 rounded-xl border border-input bg-background text-xs"
                  >
                    <option value="">Dùng chung cho tất cả</option>
                    <option value="APARTMENT">Căn hộ</option>
                    <option value="HOUSE">Nhà riêng</option>
                    <option value="ROOM">Phòng trọ</option>
                    <option value="OFFICE">Văn phòng</option>
                    <option value="COMMERCIAL_SPACE">Mặt bằng kinh doanh</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Hình thức thuê</label>
                  <select
                    value={createRentalMode}
                    onChange={(e) => setCreateRentalMode(e.target.value)}
                    className="w-full p-2 rounded-xl border border-input bg-background text-xs"
                  >
                    <option value="">Tất cả hình thức</option>
                    <option value="WHOLE_UNIT">Thuê nguyên căn</option>
                    <option value="PARTIAL">Thuê một phần / Phòng riêng</option>
                  </select>
                </div>
              </div>

              {/* Upload file Word */}
              <div className="space-y-1 pt-1">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>
                    File mẫu Word (.docx) <span className="text-rose-500">*</span>
                  </span>
                  <Link
                    to="/contracts/fields"
                    target="_blank"
                    className="text-primary hover:underline flex items-center gap-1 font-normal text-[11px]"
                  >
                    Tra cứu mã trường <ExternalLink className="w-3 h-3" />
                  </Link>
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/20">
                  <input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="docx-upload-input"
                  />
                  <label
                    htmlFor="docx-upload-input"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    {selectedFile ? (
                      <div className="text-xs font-bold text-primary truncate max-w-xs">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-foreground">
                          Nhấn để chọn file Word (.docx)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Chứa các thẻ placeholder dạng &#123;&#123;field&#125;&#125;
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="font-semibold gap-1.5"
                >
                  {isSubmitting ? "Đang xử lý..." : "Tạo mẫu & Phân tích"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
