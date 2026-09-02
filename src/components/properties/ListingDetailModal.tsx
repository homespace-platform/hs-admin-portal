import { useEffect, useState } from "react";
import {
  X,
  Building,
  Home,
  Briefcase,
  Store,
  DoorOpen,
  MapPin,
  Calendar,
  CheckCircle2,
  User,
  Phone,
  History,
  AlertTriangle,
  LoaderCircle,
  Unlock,
} from "lucide-react";
import type {
  AdminListingDetailResponse,
  ListingCategory,
  ListingDetailResponse,
  ListingStatus,
} from "@/types/listing.type";
import ListingStatusBadge from "./ListingStatusBadge";
import ListingStatusHistoryTimeline from "./ListingStatusHistoryTimeline";
import AdminMediaViewer from "./AdminMediaViewer";
import UserAvatar from "@/components/common/UserAvatar";
import { useAuth } from "@/features/auth/useAuth";
import adminListingService from "@/services/admin-listing.service";
import { getApiErrorMessage } from "@/utils/apiError";

interface ListingDetailModalProps {
  isOpen: boolean;
  listingId: string | null;
  onClose: () => void;
  onOpenModeration?: (
    listing: ListingDetailResponse,
    targetStatus: ListingStatus
  ) => void;
}

import {
  CATEGORY_NAMES,
  DAY_LABELS,
  SLOT_LABELS,
  PRICING_UNIT_NAMES,
  DEPOSIT_TYPE_NAMES,
} from "@/utils/listing-labels";

const CATEGORY_ICONS: Record<ListingCategory, React.ReactNode> = {
  APARTMENT: <Building className="h-4 w-4" />,
  HOUSE: <Home className="h-4 w-4" />,
  OFFICE: <Briefcase className="h-4 w-4" />,
  COMMERCIAL_SPACE: <Store className="h-4 w-4" />,
  ROOM: <DoorOpen className="h-4 w-4" />,
};

function formatCurrency(amount?: number | null): string {
  if (!amount || amount <= 0) return "Thỏa thuận";
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ListingDetailModal({
  isOpen,
  listingId,
  onClose,
  onOpenModeration,
}: ListingDetailModalProps) {
  const { userId } = useAuth();
  const [data, setData] = useState<AdminListingDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !listingId) return;

    let active = true;

    adminListingService
      .getById(listingId)
      .then((res) => {
        if (active) {
          setData(res);
          setErrorMessage(null);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          console.error("Error fetching admin listing detail:", error);
          const msg = getApiErrorMessage(error, "Không thể tải chi tiết bài đăng.");
          setErrorMessage(msg);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, listingId]);

  if (!isOpen) return null;

  const listing = data?.listing;
  const statusHistory = data?.statusHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            {listing && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {CATEGORY_ICONS[listing.category]}
                <span>{CATEGORY_NAMES[listing.category] || listing.category}</span>
              </span>
            )}
            <ListingStatusBadge status={listing?.status} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <LoaderCircle className="h-9 w-9 animate-spin text-primary mb-3" />
              <p className="text-xs font-medium">Đang tải chi tiết bài đăng và lịch sử...</p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-6 text-center space-y-2">
              <AlertTriangle className="h-6 w-6 text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300">{errorMessage}</p>
            </div>
          )}

          {listing && !loading && (
            <>
              {/* Media Gallery with Lightbox & Video */}
              <AdminMediaViewer media={listing.media || []} title={listing.title} />

              {/* Title & Status Reason if rejected/violation */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">{listing.title}</h2>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{listing.address?.fullAddress || listing.address?.streetLine || "Chưa có địa chỉ"}</span>
                </p>

                {listing.statusReason && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Lý do: </span>
                      <span>{listing.statusReason}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Giá cho thuê</p>
                  <p className="text-sm sm:text-base font-bold text-primary mt-1">
                    {formatCurrency(listing.pricing?.amount)}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      /{PRICING_UNIT_NAMES[listing.pricing?.unit || "MONTH"] || "tháng"}
                    </span>
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Diện tích</p>
                  <p className="text-sm sm:text-base font-bold text-foreground mt-1">
                    {listing.areaM2} m²
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Tiền đặt cọc</p>
                  <p className="text-sm sm:text-base font-bold text-foreground mt-1">
                    {listing.pricing?.depositType === "NONE"
                      ? "Không đặt cọc"
                      : listing.pricing?.depositType === "NEGOTIABLE"
                      ? "Thương lượng"
                      : listing.pricing?.depositAmount
                      ? formatCurrency(listing.pricing.depositAmount)
                      : listing.pricing?.depositMonths
                      ? `${listing.pricing.depositMonths} tháng tiền nhà`
                      : DEPOSIT_TYPE_NAMES[listing.pricing?.depositType || ""] || "—"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Ngày vào ở</p>
                  <p className="text-sm sm:text-base font-bold text-foreground mt-1">
                    {formatDate(listing.availableFrom)}
                  </p>
                </div>
              </div>

              {/* Grid 2 Columns: Landlord & Category Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Landlord Profile */}
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Thông tin chủ tin</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={listing.owner?.avatarUrl}
                      name={listing.owner?.displayName || "Chủ nhà"}
                      sizeClassName="w-11 h-11 text-sm font-bold shadow-2xs"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {listing.owner?.displayName || "Chủ nhà HomeSpace"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">ID: {listing.ownerId}</p>
                      {listing.owner?.phone && (
                        <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{listing.owner.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Viewing Schedule */}
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Lịch xem phòng</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium block">Ngày trong tuần:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {listing.viewingDays && listing.viewingDays.length > 0 ? (
                          listing.viewingDays.map((d) => (
                            <span key={d} className="rounded-lg bg-card border border-border px-2 py-0.5 font-semibold text-foreground">
                              {DAY_LABELS[d] || d}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic">Linh hoạt theo thỏa thuận</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block">Khung giờ:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {listing.viewingSlots && listing.viewingSlots.length > 0 ? (
                          listing.viewingSlots.map((s) => (
                            <span key={s} className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 font-semibold text-primary">
                              {SLOT_LABELS[s] || s}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic">Linh hoạt theo thỏa thuận</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities & Furnishings */}
              {(listing.amenities?.length > 0 || listing.furnishings?.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tiện ích & Trang bị
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.amenities?.map((a) => (
                      <span key={a.code} className="inline-flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{a.name}</span>
                      </span>
                    ))}
                    {listing.furnishings?.map((f) => (
                      <span key={f.code} className="inline-flex items-center gap-1 rounded-xl bg-muted border border-border px-3 py-1 text-xs font-medium text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>{f.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {listing.description && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mô tả chi tiết
                  </h3>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-foreground leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </div>
                </div>
              )}

              {/* Timeline Status History */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="h-4 w-4 text-primary" />
                  <span>Lịch sử trạng thái ({statusHistory.length})</span>
                </h3>

                <ListingStatusHistoryTimeline
                  history={statusHistory}
                  currentUserId={userId}
                  formatDate={formatDate}
                  emptyMessage="Chưa có lịch sử thay đổi trạng thái."
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {listing && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3.5 bg-muted/10">
            <div className="text-[11px] text-muted-foreground">
              ID: <span className="font-mono">{listing.id}</span> • Version: {listing.version}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {listing.status === "PENDING_REVIEW" && onOpenModeration && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenModeration(listing, "REJECTED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                  >
                    Từ chối
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenModeration(listing, "PUBLISHED")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    Phê duyệt
                  </button>
                </>
              )}

              {listing.status === "PUBLISHED" && onOpenModeration && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenModeration(listing, "HIDDEN")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    Ẩn tin
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenModeration(listing, "VIOLATION")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition-all"
                  >
                    Khóa vi phạm
                  </button>
                </>
              )}

              {listing.status === "VIOLATION" && onOpenModeration && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenModeration(listing, "PENDING_REVIEW")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    <Unlock className="h-4 w-4" />
                    Mở khóa
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenModeration(listing, "PUBLISHED")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Hiển thị lại
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
