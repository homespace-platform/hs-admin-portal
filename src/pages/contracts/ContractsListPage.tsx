import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck,
  Search,
  Eye,
  FileText,
  Download,
  User,
  Building,
  FileCode2,
} from "lucide-react";
import { toast } from "sonner";
import { adminContractService } from "@/services/admin-contract.service";
import type {
  ContractDocumentResponse,
  ContractResponse,
  ContractRevisionResponse,
  ContractStatus,
} from "@/types/contract.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Bản nháp (Chủ nhà đang soạn)",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
  },
  PENDING_REVIEW: {
    label: "Chờ người thuê kiểm tra",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  ACTIVE: {
    label: "Đang có hiệu lực",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold",
  },
  TERMINATED: {
    label: "Đã thanh lý",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
};

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal chi tiết hợp đồng
  const [selectedContract, setSelectedContract] = useState<ContractResponse | null>(null);
  const [revisionData, setRevisionData] = useState<ContractRevisionResponse | null>(null);
  const [documents, setDocuments] = useState<ContractDocumentResponse[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await adminContractService.listContracts(statusParam);
      setContracts(data || []);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể tải danh sách hợp đồng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (contract: ContractResponse) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
    setModalLoading(true);

    try {
      const [rev, docs] = await Promise.all([
        adminContractService.getContractRevision(contract.id),
        adminContractService.getContractDocuments(contract.id),
      ]);
      setRevisionData(rev);
      setDocuments(docs || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể tải chi tiết hợp đồng");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.landlordId.toLowerCase().includes(search.toLowerCase()) ||
        c.tenantId.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [contracts, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-primary" />
            Quản lý hợp đồng hệ thống
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi danh sách các hợp đồng thuê nhà phát sinh giữa Chủ nhà và Người thuê
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/contracts/templates">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileCode2 className="w-4 h-4 text-primary" />
              Quản lý mẫu Word
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo số hợp đồng, mã chủ nhà/người thuê..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-input bg-background font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PENDING_REVIEW">Chờ xem xét</option>
            <option value="ACTIVE">Đang có hiệu lực</option>
            <option value="TERMINATED">Đã thanh lý</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Số hợp đồng</th>
                <th className="py-3 px-4">Bên cho thuê (Chủ nhà)</th>
                <th className="py-3 px-4">Bên thuê</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Đang tải danh sách hợp đồng...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Chưa có hợp đồng nào được tạo trong hệ thống
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const statusConf = STATUS_CONFIG[c.status] || {
                    label: c.status,
                    className: "bg-muted text-muted-foreground",
                  };

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span>{c.contractNumber}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {c.landlordId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {c.tenantId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusConf.className}`}
                        >
                          {statusConf.label}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(c)}
                          className="h-7 px-2.5 text-xs font-semibold gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Hợp Đồng */}
      {isDetailModalOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Hợp đồng: {selectedContract.contractNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mã yêu cầu thuê: {selectedContract.rentalRequestId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {modalLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Đang tải thông tin chi tiết hợp đồng...
                </div>
              ) : revisionData ? (
                <>
                  {/* Hai bên ký kết */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5">
                      <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-primary" /> Bên cho thuê (Bên A)
                      </div>
                      <div className="text-muted-foreground">
                        Họ tên: <strong className="text-foreground">{revisionData.landlord?.fullName || "Chưa nhập"}</strong>
                      </div>
                      <div className="text-muted-foreground">
                        SĐT: {revisionData.landlord?.phone || "-"}
                      </div>
                      <div className="text-muted-foreground">
                        CCCD: {revisionData.landlord?.idNumber || "-"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5">
                      <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-indigo-500" /> Bên thuê (Bên B)
                      </div>
                      <div className="text-muted-foreground">
                        Họ tên: <strong className="text-foreground">{revisionData.tenant?.fullName || "Chưa nhập"}</strong>
                      </div>
                      <div className="text-muted-foreground">
                        SĐT: {revisionData.tenant?.phone || "-"}
                      </div>
                      <div className="text-muted-foreground">
                        CCCD: {revisionData.tenant?.idNumber || "-"}
                      </div>
                    </div>
                  </div>

                  {/* Bất động sản & Điều khoản thuê */}
                  <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                    <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                      <Building className="w-3.5 h-3.5 text-primary" /> Bất động sản & Thỏa thuận tài chính
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                      <div>Địa chỉ: <span className="text-foreground font-medium">{revisionData.property?.fullAddress || "-"}</span></div>
                      <div>Diện tích: <span className="text-foreground font-medium">{revisionData.property?.areaText || "-"}</span></div>
                      <div>Giá thuê chốt: <strong className="text-primary">{revisionData.financial?.amountNumber || "-"}</strong></div>
                      <div>Tiền cọc chốt: <strong className="text-foreground">{revisionData.financial?.depositAmountNumber || "-"}</strong></div>
                      <div>Thời gian thuê: <span className="text-foreground font-medium">{revisionData.lease?.durationText || "-"}</span></div>
                      <div>Ngày bắt đầu: <span className="text-foreground font-medium">{revisionData.lease?.startDateText || "-"}</span></div>
                    </div>
                  </div>

                  {/* Danh sách tài liệu đã sinh */}
                  <div className="space-y-2">
                    <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5 text-primary" /> Tài liệu đã tạo (DOCX & PDF)
                    </div>
                    {documents.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground text-xs">
                        Chưa có tài liệu nào được sinh ra cho hợp đồng này.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-[10px] font-bold uppercase">
                                {doc.documentType}
                              </Badge>
                              <span className="font-medium text-foreground">{doc.fileName}</span>
                              <span className="text-muted-foreground text-[10px]">
                                ({((doc.fileSize || 0) / 1024).toFixed(1)} KB)
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {doc.viewUrl && (
                                <a href={doc.viewUrl} target="_blank" rel="noreferrer">
                                  <Button size="sm" variant="ghost" className="h-6 text-xs gap-1">
                                    <Eye className="w-3 h-3" /> Xem
                                  </Button>
                                </a>
                              )}
                              {doc.downloadUrl && (
                                <a href={doc.downloadUrl} download={doc.fileName || undefined}>
                                  <Button size="sm" variant="outline" className="h-6 text-xs gap-1">
                                    <Download className="w-3 h-3" /> Tải về
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
