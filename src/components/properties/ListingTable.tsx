import {
  Eye,
  CheckCircle,
  XCircle,
  EyeOff,
  AlertTriangle,
  Building,
  Home,
  Briefcase,
  Store,
  DoorOpen,
  MapPin,
  Calendar,
  Phone,
  ExternalLink,
  Unlock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import ListingStatusBadge from "./ListingStatusBadge";
import type {
  AdminListingSummaryResponse,
  ListingCategory,
  ListingStatus,
} from "@/types/listing.type";

interface ListingTableProps {
  listings: AdminListingSummaryResponse[];
  loading: boolean;
  page: number;
  size: number;
  onViewDetails: (listing: AdminListingSummaryResponse) => void;
  onOpenModeration: (
    listing: AdminListingSummaryResponse,
    targetStatus: ListingStatus
  ) => void;
}

const CATEGORY_NAMES: Record<ListingCategory, string> = {
  APARTMENT: "Căn hộ",
  HOUSE: "Nhà nguyên căn",
  OFFICE: "Văn phòng",
  COMMERCIAL_SPACE: "Mặt bằng",
  ROOM: "Nhà trọ / Phòng",
};

const CATEGORY_ICONS: Record<ListingCategory, React.ReactNode> = {
  APARTMENT: <Building className="h-3.5 w-3.5" />,
  HOUSE: <Home className="h-3.5 w-3.5" />,
  OFFICE: <Briefcase className="h-3.5 w-3.5" />,
  COMMERCIAL_SPACE: <Store className="h-3.5 w-3.5" />,
  ROOM: <DoorOpen className="h-3.5 w-3.5" />,
};

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return "Thỏa thuận";
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")} triệu`;
  }
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ListingTable({
  listings,
  loading,
  page,
  size,
  onViewDetails,
  onOpenModeration,
}: ListingTableProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="w-12 text-center text-xs font-bold uppercase">STT</TableHead>
              <TableHead className="text-xs font-bold uppercase">Bài đăng</TableHead>
              <TableHead className="text-xs font-bold uppercase">Chủ tin</TableHead>
              <TableHead className="text-xs font-bold uppercase">Loại / Giá</TableHead>
              <TableHead className="text-xs font-bold uppercase">Trạng thái</TableHead>
              <TableHead className="text-xs font-bold uppercase">Gửi duyệt</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase pr-6">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="border-border">
                <TableCell className="text-center"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-16 rounded-lg shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="text-right pr-6"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground shadow-2xs">
        <Building className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-foreground">Không có bài đăng nào</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Không tìm thấy bài đăng nào theo tiêu chí tìm kiếm hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="border-border">
            <TableHead className="w-12 text-center text-xs font-bold uppercase">STT</TableHead>
            <TableHead className="text-xs font-bold uppercase">Bài đăng</TableHead>
            <TableHead className="text-xs font-bold uppercase">Chủ tin</TableHead>
            <TableHead className="text-xs font-bold uppercase">Loại / Giá</TableHead>
            <TableHead className="text-xs font-bold uppercase">Trạng thái</TableHead>
            <TableHead className="text-xs font-bold uppercase">Thời gian</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase pr-6">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((item, index) => {
            const isPendingReview = item.status === "PENDING_REVIEW";
            const isPublished = item.status === "PUBLISHED";
            const hasReason = Boolean(item.statusReason);

            return (
              <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors">
                {/* STT */}
                <TableCell className="text-center font-medium text-xs text-muted-foreground">
                  {(page - 1) * size + index + 1}
                </TableCell>

                {/* Listing Cover & Title */}
                <TableCell>
                  <div className="flex items-start gap-3 max-w-sm">
                    <div
                      onClick={() => onViewDetails(item)}
                      className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted cursor-pointer border border-border group"
                    >
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Building className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <p
                        onClick={() => onViewDetails(item)}
                        className="text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2"
                      >
                        {item.title}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">{item.fullAddress || "Chưa có địa chỉ"}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Owner */}
                <TableCell>
                  <div className="space-y-0.5 max-w-[160px]">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {item.owner?.displayName || "—"}
                    </p>
                    {item.owner?.phone && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5 text-primary" />
                        <span>{item.owner.phone}</span>
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Category & Price */}
                <TableCell>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {CATEGORY_ICONS[item.category]}
                      <span>{CATEGORY_NAMES[item.category] || item.category}</span>
                    </span>
                    <p className="text-xs font-bold text-primary">
                      {formatCurrency(item.priceAmount)}
                      <span className="text-[10px] font-normal text-muted-foreground">/th</span>
                    </p>
                  </div>
                </TableCell>

                {/* Status & Reason */}
                <TableCell>
                  <div className="space-y-1">
                    <ListingStatusBadge status={item.status} />
                    {hasReason && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 line-clamp-1 max-w-[150px] font-medium" title={item.statusReason || ""}>
                        Lý do: {item.statusReason}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Dates */}
                <TableCell>
                  <div className="space-y-0.5 text-[11px] text-muted-foreground">
                    {item.submittedAt && (
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Gửi: {formatDate(item.submittedAt)}</span>
                      </p>
                    )}
                    {item.publishedAt && (
                      <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span>Duyệt: {formatDate(item.publishedAt)}</span>
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Button */}
                    <button
                      type="button"
                      onClick={() => onViewDetails(item)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Xem</span>
                    </button>

                    {/* Pending Review Actions: Approve / Reject */}
                    {isPendingReview && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenModeration(item, "PUBLISHED")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition-all"
                          title="Duyệt bài đăng"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Duyệt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenModeration(item, "REJECTED")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                          title="Từ chối duyệt"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </>
                    )}

                    {/* Published Actions: Rented externally / Hide / Violation */}
                    {isPublished && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenModeration(item, "RENTED_EXTERNALLY")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
                          title="Đánh dấu cho thuê ngoài hệ thống"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Thuê ngoài</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenModeration(item, "HIDDEN")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                          title="Ẩn tin"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Ẩn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenModeration(item, "VIOLATION")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2 text-xs font-bold text-white hover:bg-red-700 shadow-2xs transition-all"
                          title="Khóa vi phạm"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Khóa</span>
                        </button>
                      </>
                    )}

                    {/* Correct a mis-set rented state without a full re-review */}
                    {item.status === "RENTED" && (
                      <button
                        type="button"
                        onClick={() => onOpenModeration(item, "RENTED_EXTERNALLY")}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
                        title="Chuyển sang cho thuê ngoài hệ thống"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Thuê ngoài</span>
                      </button>
                    )}

                    {item.status === "RENTED_EXTERNALLY" && (
                      <button
                        type="button"
                        onClick={() => onOpenModeration(item, "RENTED")}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                        title="Chuyển sang đã cho thuê qua HomeSpace"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Thuê nội bộ</span>
                      </button>
                    )}

                    {item.status === "VIOLATION" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenModeration(item, "PENDING_REVIEW")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                          title="Mở khóa và chuyển chờ duyệt"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Mở khóa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenModeration(item, "PUBLISHED")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition-all"
                          title="Mở khóa và hiển thị lại ngay"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Hiển thị lại</span>
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
