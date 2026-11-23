import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBreadcrumbTitle } from "@/components/common/BreadcrumbTitle";
import {
  ArrowLeft,
  Building,
  Home,
  Briefcase,
  Store,
  DoorOpen,
  MapPin,
  CheckCircle2,
  User,
  Phone,
  AlertTriangle,
  LoaderCircle,
  Info,
  CheckCircle,
  XCircle,
  EyeOff,
  RotateCcw,
  ExternalLink,
  Unlock,
  ShieldCheck,
  History,
  Layers,
  Receipt,
  Wallet,
  FileText,
  Calendar,
  Clock,
  Eye,
  Maximize2,
  BedDouble,
  Bath,
} from "lucide-react";
import ListingStatusBadge from "@/components/properties/ListingStatusBadge";
import ListingModerationDialog from "@/components/properties/ListingModerationDialog";
import ListingStatusHistoryTimeline from "@/components/properties/ListingStatusHistoryTimeline";
import AdminMediaViewer from "@/components/properties/AdminMediaViewer";
import UserAvatar from "@/components/common/UserAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { PERMISSIONS } from "@/config/permissions";
import { useHasPermission } from "@/hooks/usePermission";
import adminListingService from "@/services/admin-listing.service";
import { getApiErrorMessage } from "@/utils/apiError";
import type {
  AdminListingDetailResponse,
  ListingCategory,
  ListingStatus,
} from "@/types/listing.type";
import {
  CATEGORY_NAMES,
  DIRECTION_NAMES,
  LEGAL_STATUS_NAMES,
  FURNISHING_NAMES,
  OFFICE_GRADE_NAMES,
  HANDOVER_STATUS_NAMES,
  COMMERCIAL_POSITION_NAMES,
  PARKING_NAMES,
  ACCESS_TYPE_NAMES,
  RESTROOM_TYPE_NAMES,
  KITCHEN_TYPE_NAMES,
  BALCONY_TYPE_NAMES,
  WINDOW_TYPE_NAMES,
  OPERATING_MODE_NAMES,
  METER_TYPE_NAMES,
  CHARGE_TYPE_NAMES,
  PRICING_UNIT_NAMES,
  DEPOSIT_TYPE_NAMES,
  PAYMENT_CYCLE_NAMES,
  DAY_LABELS,
  SLOT_LABELS,
  formatChargeFee,
} from "@/utils/listing-labels";

const CATEGORY_ICONS: Record<ListingCategory, React.ReactNode> = {
  APARTMENT: <Building className="h-4 w-4" />,
  HOUSE: <Home className="h-4 w-4" />,
  OFFICE: <Briefcase className="h-4 w-4" />,
  COMMERCIAL_SPACE: <Store className="h-4 w-4" />,
  ROOM: <DoorOpen className="h-4 w-4" />,
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ACTION_BTN = `inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors disabled:opacity-50 ${focusRing}`;

const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground";

const SUBHEAD_CLASS = "mb-2 text-sm font-medium text-muted-foreground";
const DETAIL_GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 gap-x-8";

function mapsEmbedSrc(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function formatCurrency(amount?: number | null): string {
  if (!amount || amount <= 0) return "Thỏa thuận";
  return new Intl.NumberFormat("vi-VN").format(amount);
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

function DetailItem({
  label,
  value,
  highlight = false,
  showWhenEmpty = true,
}: {
  label: string;
  value?: React.ReactNode;
  highlight?: boolean;
  /** Khi duyệt tin: vẫn hiện ô trống để admin biết field bị thiếu */
  showWhenEmpty?: boolean;
}) {
  const empty = value === undefined || value === null || value === "";
  if (empty && !showWhenEmpty) return null;
  // Rendered inside a role="list" grid (DETAIL_GRID_CLASS).
  return (
    <div role="listitem" className="flex items-baseline justify-between gap-4 border-b border-border/60 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`min-w-0 text-right text-sm font-semibold break-words ${
          empty
            ? "text-amber-600 dark:text-amber-400 italic"
            : highlight
            ? "text-primary"
            : "text-foreground"
        }`}
      >
        {empty ? "Chưa cập nhật" : value}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Layers;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs scroll-mt-28">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function FactTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 rounded-xl bg-muted/40 px-2 py-3 text-center">
      <Icon className="h-5 w-5 text-primary" />
      <p className="font-heading text-sm font-semibold break-words">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function PropertyViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const canModerate = useHasPermission(PERMISSIONS.LISTING_MODERATE);
  const listingId = searchParams.get("id");

  const [data, setData] = useState<AdminListingDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [error, setError] = useState(
    !listingId ? "Không tìm thấy mã tin đăng trong đường dẫn." : ""
  );

  // Moderation Dialog State
  const [moderationTarget, setModerationTarget] = useState<ListingStatus | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useBreadcrumbTitle(data?.listing?.title);

  useEffect(() => {
    if (!listingId) return;

    let active = true;

    adminListingService
      .getById(listingId)
      .then((res) => {
        if (active) {
          setData(res);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Error loading admin listing detail:", err);
          const msg = getApiErrorMessage(err, "Không thể tải chi tiết bài đăng hoặc tin không tồn tại.");
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Đang tải thông tin chi tiết bài đăng...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <Info className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Không thể hiển thị tin đăng</h2>
        <p className="text-sm text-muted-foreground">{error || "Tin đăng không tồn tại hoặc đã bị xóa."}</p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const listing = data.listing;
  const statusHistory = data.statusHistory || [];

  const fullAddress =
    listing.address?.display ||
    [listing.address?.street, listing.address?.ward, listing.address?.city]
      .filter(Boolean)
      .join(", ");

  const isPendingReview = listing.status === "PENDING_REVIEW" || Boolean(data.pendingEditId);
  const isPublished = listing.status === "PUBLISHED" && !data.pendingEditId;

  const bedroomCount = listing.apartmentDetail?.bedroomCount ?? listing.houseDetail?.bedroomCount ?? null;
  const bathroomCount = listing.apartmentDetail?.bathroomCount ?? listing.houseDetail?.bathroomCount ?? null;
  const depositText =
    listing.pricing?.depositType === "NONE"
      ? "Không đặt cọc"
      : listing.pricing?.depositAmount
      ? `${formatCurrency(listing.pricing.depositAmount)} ₫`
      : listing.pricing?.depositMonths
      ? `${listing.pricing.depositMonths} tháng tiền thuê`
      : DEPOSIT_TYPE_NAMES[listing.pricing?.depositType || ""] || "—";

  function handleModerationSuccess() {
    setModerationTarget(null);
    // Refresh listing data
    if (listingId) {
      adminListingService.getById(listingId).then((res) => {
        setData(res);
      });
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in-50 duration-200">
      {/* Top Info & Moderation Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {listing.branchName && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Building className="h-3.5 w-3.5 text-blue-600" />
                {listing.branchName}
              </span>
            )}
            {listing.publishedAt ? (
              <span className="text-xs text-muted-foreground">
                Duyệt ngày: {formatDate(listing.publishedAt)}
              </span>
            ) : listing.submittedAt ? (
              <span className="text-xs text-muted-foreground">
                Gửi duyệt: {formatDate(listing.submittedAt)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`${ACTION_BTN} border border-border bg-card text-foreground hover:bg-muted`}
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách tin
          </button>

          {/* Pending Review Actions */}
          {canModerate && isPendingReview && (
            <>
              <button
                type="button"
                onClick={() => setModerationTarget("REJECTED")}
                className={`${ACTION_BTN} border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100`}
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => setModerationTarget("PUBLISHED")}
                disabled={Boolean(data.reviewError || data.protectedRental && !data.pendingEditId)}
                className={`${ACTION_BTN} bg-emerald-600 text-white hover:bg-emerald-700`}
              >
                <CheckCircle className="h-4 w-4" />
                Phê duyệt
              </button>
            </>
          )}

          {/* Published Actions */}
          {canModerate && isPublished && (
            <>
              <button
                type="button"
                onClick={() => setModerationTarget("RENTED_EXTERNALLY")}
                className={`${ACTION_BTN} border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100`}
              >
                <ExternalLink className="h-4 w-4" />
                Cho thuê ngoài hệ thống
              </button>
              <button
                type="button"
                onClick={() => setModerationTarget("HIDDEN")}
                className={`${ACTION_BTN} border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100`}
              >
                <EyeOff className="h-4 w-4" />
                Ẩn tin
              </button>
              <div className="ml-auto border-l border-border pl-3 sm:ml-2">
                <button
                  type="button"
                  onClick={() => setModerationTarget("VIOLATION")}
                  className={`${ACTION_BTN} bg-red-600 text-white hover:bg-red-700`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Khóa vi phạm
                </button>
              </div>
            </>
          )}

          {canModerate && listing.status === "VIOLATION" && (
            <>
              <button
                type="button"
                onClick={() => setModerationTarget("PENDING_REVIEW")}
                disabled={Boolean(data.protectedRental)}
                className={`${ACTION_BTN} border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100`}
              >
                <Unlock className="h-4 w-4" />
                Mở khóa
              </button>
              <button
                type="button"
                onClick={() => setModerationTarget("PUBLISHED")}
                disabled={Boolean(data.protectedRental)}
                className={`${ACTION_BTN} bg-emerald-600 text-white hover:bg-emerald-700`}
              >
                <CheckCircle className="h-4 w-4" />
                Hiển thị lại
              </button>
            </>
          )}

          {/* Re-open if rejected, hidden or already rented */}
          {canModerate && !data.pendingEditId && !data.protectedRental && (listing.status === "REJECTED" ||
            listing.status === "HIDDEN" ||
            listing.status === "EXPIRED" ||
            listing.status === "RENTED_EXTERNALLY") && (
            <button
              type="button"
              onClick={() => setModerationTarget("PENDING_REVIEW")}
              className={`${ACTION_BTN} border border-border bg-card text-foreground hover:bg-muted`}
            >
              <RotateCcw className="h-4 w-4 text-amber-500" />
              Chuyển chờ duyệt
            </button>
          )}
        </div>
      </div>

      {/* Alert banners (client alertBanner slot) */}
      {data.reviewError && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 break-words">
            Không thể tải nội dung gửi duyệt: {data.reviewError}. Thông tin bên dưới là nội dung đang áp dụng. Bạn có thể từ chối hoặc tải lại để kiểm tra.
          </p>
        </div>
      )}
      {listing.statusReason && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 break-words">
            <span className="font-semibold">Lý do: </span>
            <span>{listing.statusReason}</span>
          </div>
        </div>
      )}

      {/* Top grid: gallery (7) + overview/owner (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="min-w-0 lg:col-span-7 lg:row-start-1">
          <AdminMediaViewer media={listing.media || []} title={listing.title} />
        </div>

        <div className="min-w-0 space-y-4 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2">
          {/* Overview */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-foreground">
                {CATEGORY_ICONS[listing.category]}
                {CATEGORY_NAMES[listing.category] || listing.category}
              </span>
              <ListingStatusBadge status={listing.status} />
            </div>

            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight leading-snug text-balance break-words">
              {listing.title}
            </h1>

            <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="leading-relaxed break-words">{fullAddress || "Chưa có thông tin địa chỉ"}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Tạo: {formatDate(listing.createdAt)}
              </span>
              {listing.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Duyệt: {formatDate(listing.publishedAt)}</span>
                </>
              )}
              {listing.viewCount != null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {listing.viewCount} lượt xem
                  </span>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-2">
              <span className="font-heading text-3xl font-bold text-primary tabular-nums">
                {formatCurrency(listing.pricing?.amount)} ₫
              </span>
              <span className="text-sm text-muted-foreground">
                /{PRICING_UNIT_NAMES[listing.pricing?.unit || "MONTH"] || "tháng"}
              </span>
              {listing.pricing?.negotiable === true && (
                <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  Có thể thương lượng
                </span>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <FactTile icon={Maximize2} label="Diện tích" value={`${listing.areaM2} m²`} />
              {bedroomCount != null ? (
                <FactTile icon={BedDouble} label="Phòng ngủ" value={`${bedroomCount} PN`} />
              ) : (
                <FactTile icon={Building} label="Loại hình" value={CATEGORY_NAMES[listing.category] || listing.category} />
              )}
              {bathroomCount != null && (
                <FactTile icon={Bath} label="Phòng tắm / WC" value={`${bathroomCount} WC`} />
              )}
            </div>

            {/* Admin info (moved from old aside) */}
            <div className="mt-5 border-t border-border pt-5">
              <h3 className="mb-1 font-heading text-base font-semibold">Thông tin quản trị</h3>
              <div role="list">
                <DetailItem label="Tiền đặt cọc" value={depositText} />
                <DetailItem label="Ngày vào ở" value={listing.availableFrom ? formatDate(listing.availableFrom) : "Ở ngay"} />
                <DetailItem label="Chi nhánh" value={listing.branchName || "Tin độc lập"} />
                <DetailItem label="Mã tin" value={<span className="font-mono text-xs break-all">{listing.id}</span>} />
                {listing.publishedAt && <DetailItem label="Ngày duyệt" value={formatDate(listing.publishedAt)} />}
              </div>
            </div>
          </section>
        </div>

        {/* Owner: under the gallery on desktop to balance the taller right column (same slot as the client's landlord card) */}
        <div className="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <UserAvatar
                  src={listing.owner?.avatarUrl}
                  name={listing.owner?.displayName || "Chủ nhà"}
                  sizeClassName="w-14 h-14 text-lg font-bold shadow-xs"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-bold text-base text-foreground truncate">
                  {listing.owner?.displayName || "Chủ nhà HomeSpace"}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>Chủ bài đăng</span>
                </p>
              </div>
            </div>
            <p className="font-mono text-xs text-muted-foreground break-all">ID: {listing.ownerId}</p>
            {listing.owner?.phone && (
              <a
                href={`tel:${listing.owner.phone}`}
                className={`inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary hover:underline ${focusRing}`}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{listing.owner.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Detail sections (full width below the top grid) */}
      <div className="space-y-6">
        <SectionCard title="Thông tin cơ bản" icon={Layers}>
          <div role="list" className={DETAIL_GRID_CLASS}>
            <DetailItem label="Mã tin đăng" value={<span className="font-mono text-xs break-all">{listing.id}</span>} />
            <DetailItem
              label="Chi nhánh"
              value={
                listing.branchName ? (
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {listing.branchName}
                  </span>
                ) : (
                  <span className="text-muted-foreground font-normal">Tin độc lập (Không thuộc chi nhánh)</span>
                )
              }
            />
            <DetailItem label="Loại hình" value={CATEGORY_NAMES[listing.category] || listing.category} />
            <DetailItem label="Số xe máy tối đa" value={listing.maxMotorbikeCount} showWhenEmpty={false} />
            <DetailItem label="Số ô tô tối đa" value={listing.maxCarCount} showWhenEmpty={false} />
            <DetailItem
              label="Diện tích"
              value={listing.areaM2 != null ? `${listing.areaM2} m²` : undefined}
            />
            <DetailItem
              label="Thời điểm vào ở"
              value={listing.availableFrom ? formatDate(listing.availableFrom) : "Dọn vào ngay"}
            />
            <DetailItem
              label="Thương lượng giá"
              value={
                listing.pricing?.negotiable === true
                  ? "Có thể thương lượng"
                  : listing.pricing?.negotiable === false
                  ? "Giá cố định"
                  : undefined
              }
            />
            <DetailItem
              label="Bao gồm phí quản lý"
              value={
                listing.pricing?.managementFeeIncluded === true
                  ? "Đã bao gồm trong giá thuê"
                  : listing.pricing?.managementFeeIncluded === false
                  ? "Chưa bao gồm"
                  : undefined
              }
            />
          </div>
        </SectionCard>

        {/* Section 2: Chi tiết theo loại hình */}
        {listing.category === "APARTMENT" && listing.apartmentDetail && (
          <SectionCard title="Chi tiết căn hộ / chung cư" icon={Layers}>
            <div role="list" className={DETAIL_GRID_CLASS}>
              <DetailItem label="Tên dự án / Tòa nhà" value={listing.apartmentDetail.projectName} />
              <DetailItem label="Tòa / Block" value={listing.apartmentDetail.buildingBlock} />
              <DetailItem label="Mã căn hộ" value={listing.apartmentDetail.unitCode} />
              <DetailItem label="Tầng số" value={listing.apartmentDetail.floorNumber} />
              <DetailItem label="Tổng số tầng tòa nhà" value={listing.apartmentDetail.buildingTotalFloors} />
              <DetailItem label="Số phòng ngủ" value={`${listing.apartmentDetail.bedroomCount} phòng`} />
              <DetailItem label="Số phòng tắm / vệ sinh" value={`${listing.apartmentDetail.bathroomCount} phòng`} />
              <DetailItem label="Số phòng khách" value={listing.apartmentDetail.livingRoomCount} />
              <DetailItem label="Số phòng bếp" value={listing.apartmentDetail.kitchenCount} />
              <DetailItem
                label="Hướng cửa chính"
                value={DIRECTION_NAMES[listing.apartmentDetail.mainDoorDirection || ""] || listing.apartmentDetail.mainDoorDirection}
              />
              <DetailItem
                label="Hướng ban công"
                value={DIRECTION_NAMES[listing.apartmentDetail.balconyDirection || ""] || listing.apartmentDetail.balconyDirection}
              />
              <DetailItem
                label="Tình trạng nội thất"
                value={FURNISHING_NAMES[listing.apartmentDetail.furnishingStatus || ""] || listing.apartmentDetail.furnishingStatus}
              />
              <DetailItem label="Số người ở tối đa" value={listing.apartmentDetail.maxOccupants ? `${listing.apartmentDetail.maxOccupants} người` : undefined} />
              <DetailItem
                label="Tình trạng pháp lý"
                value={LEGAL_STATUS_NAMES[listing.apartmentDetail.legalStatus || ""] || listing.apartmentDetail.legalStatus}
              />
              <DetailItem label="Tầm nhìn (View)" value={listing.apartmentDetail.viewDescription} />
            </div>
          </SectionCard>
        )}

        {listing.category === "HOUSE" && listing.houseDetail && (
          <SectionCard title="Chi tiết nhà ở nguyên căn" icon={Layers}>
            <div role="list" className={DETAIL_GRID_CLASS}>
              <DetailItem label="Diện tích đất" value={listing.houseDetail.landAreaM2 ? `${listing.houseDetail.landAreaM2} m²` : undefined} />
              <DetailItem label="Chiều ngang mặt tiền" value={listing.houseDetail.frontageWidthM ? `${listing.houseDetail.frontageWidthM} m` : undefined} />
              <DetailItem label="Chiều dài nhà" value={listing.houseDetail.lengthM ? `${listing.houseDetail.lengthM} m` : undefined} />
              <DetailItem label="Độ rộng đường vào" value={listing.houseDetail.accessRoadWidthM ? `${listing.houseDetail.accessRoadWidthM} m` : undefined} />
              <DetailItem
                label="Số lượng mặt tiền"
                value={
                  listing.houseDetail.frontageCount === 1
                    ? "1 mặt tiền"
                    : listing.houseDetail.frontageCount === 2
                    ? "2 mặt tiền (Căn góc)"
                    : listing.houseDetail.frontageCount
                    ? `${listing.houseDetail.frontageCount} mặt tiền`
                    : undefined
                }
              />
              <DetailItem label="Tổng số tầng" value={listing.houseDetail.totalFloors} />
              <DetailItem label="Số phòng ngủ" value={`${listing.houseDetail.bedroomCount} phòng`} />
              <DetailItem label="Số phòng vệ sinh" value={`${listing.houseDetail.bathroomCount} phòng`} />
              <DetailItem label="Số phòng khách" value={listing.houseDetail.livingRoomCount} />
              <DetailItem label="Số phòng bếp" value={listing.houseDetail.kitchenCount} />
              <DetailItem label="Có sân thượng" value={listing.houseDetail.hasRooftop ? "Có sân thượng" : "Không"} />
              <DetailItem label="Có garage / chỗ đỗ xe" value={listing.houseDetail.hasGarage ? "Có garage ô tô" : "Không"} />
              <DetailItem
                label="Lối đi sử dụng"
                value={ACCESS_TYPE_NAMES[listing.houseDetail.accessType || ""] || listing.houseDetail.accessType}
              />
              <DetailItem
                label="Tình trạng nội thất"
                value={FURNISHING_NAMES[listing.houseDetail.furnishingStatus || ""] || listing.houseDetail.furnishingStatus}
              />
              <DetailItem label="Số người ở tối đa" value={listing.houseDetail.maxOccupants ? `${listing.houseDetail.maxOccupants} người` : undefined} />
              <DetailItem label="Số lượng xe tối đa" value={listing.houseDetail.maxVehicles ? `${listing.houseDetail.maxVehicles} xe` : undefined} />
              <DetailItem
                label="Tình trạng pháp lý"
                value={LEGAL_STATUS_NAMES[listing.houseDetail.legalStatus || ""] || listing.houseDetail.legalStatus}
              />
              <DetailItem
                label="Phạm vi cho thuê"
                value={listing.houseDetail.rentalScopeDescription}
              />
              <DetailItem
                label="Tầng cho thuê"
                value={
                  listing.houseDetail.rentedFloorFrom != null && listing.houseDetail.rentedFloorTo != null
                    ? `Từ tầng ${listing.houseDetail.rentedFloorFrom} đến tầng ${listing.houseDetail.rentedFloorTo}`
                    : listing.houseDetail.rentedFloorFrom != null
                    ? `Từ tầng ${listing.houseDetail.rentedFloorFrom}`
                    : undefined
                }
              />
            </div>
          </SectionCard>
        )}

        {listing.category === "OFFICE" && listing.officeDetail && (
          <SectionCard title="Chi tiết văn phòng" icon={Layers}>
            <div role="list" className={DETAIL_GRID_CLASS}>
              <DetailItem label="Tên tòa nhà văn phòng" value={listing.officeDetail.buildingName} />
              <DetailItem
                label="Hạng văn phòng"
                value={OFFICE_GRADE_NAMES[listing.officeDetail.officeGrade || ""] || listing.officeDetail.officeGrade}
              />
              <DetailItem label="Tầng số" value={listing.officeDetail.floorNumber} />
              <DetailItem
                label="Tình trạng bàn giao"
                value={HANDOVER_STATUS_NAMES[listing.officeDetail.handoverStatus || ""] || listing.officeDetail.handoverStatus}
              />
              <DetailItem label="Số lượng chỗ ngồi ước tính" value={listing.officeDetail.expectedSeats ? `${listing.officeDetail.expectedSeats} chỗ` : undefined} />
              <DetailItem label="Diện tích chia nhỏ tối thiểu" value={listing.officeDetail.minimumDivisibleAreaM2 ? `${listing.officeDetail.minimumDivisibleAreaM2} m²` : undefined} />
              <DetailItem label="Số lượng nhà vệ sinh" value={listing.officeDetail.restroomCount} />
              <DetailItem
                label="Hệ thống vệ sinh"
                value={RESTROOM_TYPE_NAMES[listing.officeDetail.restroomType || ""] || (listing.officeDetail.restroomType === "PRIVATE" ? "Vệ sinh riêng" : "Vệ sinh chung tầng")}
              />
              <DetailItem
                label="Khu vực Pantry"
                value={
                  listing.officeDetail.pantryType === "PRIVATE"
                    ? "Pantry riêng"
                    : listing.officeDetail.pantryType === "SHARED"
                    ? "Pantry chung tòa nhà"
                    : listing.officeDetail.pantryType === "NONE"
                    ? "Không có"
                    : listing.officeDetail.pantryType
                }
              />
              <DetailItem
                label="Chế độ giờ hoạt động"
                value={OPERATING_MODE_NAMES[listing.officeDetail.operatingMode || ""] || listing.officeDetail.operatingMode}
              />
              <DetailItem label="Sức chứa đỗ ô tô" value={listing.officeDetail.carParkingCapacity ? `${listing.officeDetail.carParkingCapacity} ô tô` : undefined} />
              <DetailItem label="Sức chứa đỗ xe máy" value={listing.officeDetail.motorbikeParkingCapacity ? `${listing.officeDetail.motorbikeParkingCapacity} xe` : undefined} />
            </div>
          </SectionCard>
        )}

        {listing.category === "COMMERCIAL_SPACE" && listing.commercialDetail && (
          <SectionCard title="Chi tiết mặt bằng kinh doanh" icon={Layers}>
            <div role="list" className={DETAIL_GRID_CLASS}>
              <DetailItem
                label="Vị trí mặt bằng"
                value={COMMERCIAL_POSITION_NAMES[listing.commercialDetail.positionType || ""] || listing.commercialDetail.positionType}
              />
              <DetailItem label="Chiều ngang mặt tiền" value={listing.commercialDetail.frontageWidthM ? `${listing.commercialDetail.frontageWidthM} m` : undefined} />
              <DetailItem label="Chiều dài mặt bằng" value={listing.commercialDetail.lengthM ? `${listing.commercialDetail.lengthM} m` : undefined} />
              <DetailItem label="Độ rộng lòng đường" value={listing.commercialDetail.roadWidthM ? `${listing.commercialDetail.roadWidthM} m` : undefined} />
              <DetailItem
                label="Số lượng mặt tiền"
                value={
                  listing.commercialDetail.frontageCount === 1
                    ? "1 mặt tiền"
                    : listing.commercialDetail.frontageCount === 2
                    ? "2 mặt tiền (Lô góc)"
                    : listing.commercialDetail.frontageCount
                    ? `${listing.commercialDetail.frontageCount} mặt tiền`
                    : undefined
                }
              />
              <DetailItem label="Số tầng cho thuê" value={listing.commercialDetail.rentedFloorCount ? `${listing.commercialDetail.rentedFloorCount} tầng` : undefined} />
              <DetailItem label="Có gác lửng" value={listing.commercialDetail.hasMezzanine ? "Có gác lửng" : "Không"} />
              <DetailItem label="Số lượng nhà vệ sinh" value={listing.commercialDetail.restroomCount} />
              <DetailItem
                label="Tình trạng bàn giao"
                value={HANDOVER_STATUS_NAMES[listing.commercialDetail.handoverStatus || ""] || listing.commercialDetail.handoverStatus}
              />
              <DetailItem
                label="Chỗ để xe"
                value={PARKING_NAMES[listing.commercialDetail.parkingType || ""] || listing.commercialDetail.parkingType}
              />
              <DetailItem
                label="Lối đi sử dụng"
                value={ACCESS_TYPE_NAMES[listing.commercialDetail.accessType || ""] || listing.commercialDetail.accessType}
              />
              <DetailItem label="Nguồn điện 3 pha" value={listing.commercialDetail.hasThreePhasePower ? "Có điện 3 pha" : "Điện dân dụng 1 pha"} />
              <DetailItem label="Hệ thống PCCC tiêu chuẩn" value={listing.commercialDetail.hasStandardFireSafety ? "Đã thẩm duyệt PCCC" : "Chưa có"} />
              <DetailItem label="Ngành nghề hạn chế" value={listing.commercialDetail.restrictedBusinesses} />
              <DetailItem label="Giờ hoạt động" value={listing.commercialDetail.operatingHoursDescription} />
              <DetailItem label="Khu vực bốc xếp hàng" value={listing.commercialDetail.loadingAreaDescription} />
            </div>
          </SectionCard>
        )}

        {listing.category === "ROOM" && listing.roomDetail && (
          <SectionCard title="Chi tiết nhà trọ / phòng cho thuê" icon={Layers}>
            <div role="list" className={DETAIL_GRID_CLASS}>
              <DetailItem label="Mã / Số phòng" value={listing.roomDetail.roomCode} />
              <DetailItem label="Tầng số" value={listing.roomDetail.floorNumber} />
              <DetailItem
                label="Nhà vệ sinh"
                value={
                  RESTROOM_TYPE_NAMES[listing.roomDetail.restroomType || ""] ||
                  listing.roomDetail.restroomType
                }
              />
              <DetailItem
                label="Khu vực nấu ăn"
                value={
                  KITCHEN_TYPE_NAMES[listing.roomDetail.kitchenType || ""] ||
                  listing.roomDetail.kitchenType
                }
              />
              <DetailItem
                label="Cửa sổ phòng"
                value={
                  listing.roomDetail.hasWindow === true
                    ? WINDOW_TYPE_NAMES.YES
                    : listing.roomDetail.hasWindow === false
                    ? WINDOW_TYPE_NAMES.NO
                    : undefined
                }
              />
              <DetailItem
                label="Ban công"
                value={
                  BALCONY_TYPE_NAMES[listing.roomDetail.balconyType || ""] ||
                  listing.roomDetail.balconyType
                }
              />
              <DetailItem
                label="Gác lửng / Gác xép"
                value={
                  listing.roomDetail.hasMezzanine === true
                    ? "Có gác lửng cao ráo"
                    : listing.roomDetail.hasMezzanine === false
                    ? "Không có gác lửng"
                    : undefined
                }
              />
              <DetailItem
                label="Tình trạng nội thất"
                value={
                  FURNISHING_NAMES[listing.roomDetail.furnishingStatus || ""] ||
                  listing.roomDetail.furnishingStatus
                }
              />
              <DetailItem
                label="Số người ở tối đa"
                value={
                  listing.roomDetail.maxOccupants != null
                    ? `${listing.roomDetail.maxOccupants} người`
                    : undefined
                }
              />
              <DetailItem
                label="Số lượng xe tối đa"
                value={
                  listing.roomDetail.maxVehicles != null
                    ? `${listing.roomDetail.maxVehicles} xe`
                    : undefined
                }
              />
              <DetailItem
                label="Lối đi sử dụng"
                value={
                  ACCESS_TYPE_NAMES[listing.roomDetail.accessType || ""] ||
                  listing.roomDetail.accessType
                }
              />
              <DetailItem
                label="Giờ giấc sinh hoạt"
                value={
                  OPERATING_MODE_NAMES[listing.roomDetail.accessHoursType || ""] ||
                  listing.roomDetail.accessHoursType
                }
              />
              <DetailItem
                label="Đồng hồ điện"
                value={
                  METER_TYPE_NAMES[listing.roomDetail.electricMeterType || ""] ||
                  listing.roomDetail.electricMeterType
                }
              />
              <DetailItem
                label="Đồng hồ nước"
                value={
                  METER_TYPE_NAMES[listing.roomDetail.waterMeterType || ""] ||
                  listing.roomDetail.waterMeterType
                }
              />
              <DetailItem
                label="Chính sách chỗ để xe"
                value={
                  PARKING_NAMES[listing.roomDetail.parkingPolicy || ""] ||
                  listing.roomDetail.parkingPolicy
                }
              />
            </div>
          </SectionCard>
        )}

        {/* Section 3: Tiện ích & Trang bị nội thất */}
        <SectionCard title="Tiện ích & Trang bị nội thất" icon={CheckCircle2}>
          <div className="space-y-4">
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h3 className={SUBHEAD_CLASS}>
                  Tiện ích sẵn có ({listing.amenities.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((item) => (
                    <span key={item.code} className={chipClass}>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {listing.customAmenities && listing.customAmenities.length > 0 && (
              <div>
                <h3 className={SUBHEAD_CLASS}>
                  Tiện ích bổ sung do chủ nhà tự nhập ({listing.customAmenities.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.customAmenities.map((name, idx) => (
                    <span key={idx} className={chipClass}>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {listing.furnishings && listing.furnishings.length > 0 && (
              <div>
                <h3 className={SUBHEAD_CLASS}>
                  Trang thiết bị bàn giao ({listing.furnishings.length})
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-105 border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-left font-semibold text-muted-foreground">
                        <th scope="col" className="w-12 px-3 py-2.5">STT</th>
                        <th scope="col" className="px-3 py-2.5">Tên tài sản / Trang thiết bị</th>
                        <th scope="col" className="w-24 px-3 py-2.5">Số lượng</th>
                        <th scope="col" className="px-3 py-2.5">Hiện trạng bàn giao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listing.furnishings.map((item) => (
                        <tr key={item.index} className="border-t border-border/60 hover:bg-muted/30">
                          <td className="px-3 py-2.5 text-muted-foreground">{item.index}</td>
                          <td className="px-3 py-2.5 font-medium text-foreground">{item.assetName}</td>
                          <td className="px-3 py-2.5 text-foreground">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{item.conditionText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!listing.amenities || listing.amenities.length === 0) &&
              (!listing.customAmenities || listing.customAmenities.length === 0) &&
              (!listing.furnishings || listing.furnishings.length === 0) && (
                <p className="text-xs text-muted-foreground italic">Không có thông tin tiện ích bổ sung.</p>
              )}
          </div>
        </SectionCard>

        {/* Section 4: Biểu phí & Chi phí hàng tháng */}
        <SectionCard title="Biểu phí & Chi phí dịch vụ hàng tháng" icon={Receipt}>
          {listing.charges && listing.charges.length > 0 ? (
            <div role="list" className={DETAIL_GRID_CLASS}>
              {listing.charges.map((charge, idx) => (
                <div key={idx} role="listitem" className="min-w-0 border-b border-border/60 py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0 text-sm text-muted-foreground break-words">
                      {charge.customName || CHARGE_TYPE_NAMES[charge.chargeType] || charge.chargeType}
                      {charge.includedInRent ? (
                        <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Miễn phí / Đã bao gồm
                        </span>
                      ) : (
                        <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          Tính phí
                        </span>
                      )}
                    </span>
                    <span className="text-right text-sm font-semibold tabular-nums text-primary break-words">
                      {formatChargeFee(charge, formatCurrency)}
                    </span>
                  </div>
                  {charge.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{charge.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Không có biểu phí dịch vụ phát sinh riêng.</p>
          )}
        </SectionCard>

        {/* Section 5: Giá thuê & Điều kiện hợp đồng */}
        <SectionCard title="Giá thuê & Điều kiện hợp đồng" icon={Wallet}>
          <div role="list" className={DETAIL_GRID_CLASS}>
            <DetailItem
              label="Giá thuê niêm yết"
              value={`${formatCurrency(listing.pricing?.amount)} ₫ / ${
                PRICING_UNIT_NAMES[listing.pricing?.unit || "MONTH"] || "tháng"
              }`}
              highlight
            />
            <DetailItem
              label="Loại tiền đặt cọc"
              value={
                listing.pricing?.depositType === "NONE"
                  ? "Không đặt cọc"
                  : listing.pricing?.depositAmount
                  ? `${formatCurrency(listing.pricing.depositAmount)} ₫ (${DEPOSIT_TYPE_NAMES[listing.pricing.depositType] || "Số tiền cố định"})`
                  : listing.pricing?.depositMonths
                  ? `${listing.pricing.depositMonths} tháng tiền thuê`
                  : DEPOSIT_TYPE_NAMES[listing.pricing?.depositType || ""] || "—"
              }
            />
            <DetailItem
              label="Chu kỳ thanh toán"
              value={
                PAYMENT_CYCLE_NAMES[listing.pricing?.paymentCycle || ""] || listing.pricing?.paymentCycle || "Thanh toán từng tháng"
              }
            />
            <DetailItem
              label="Thời hạn hợp đồng tối thiểu"
              value={`${listing.pricing?.minimumLeaseMonths || 1} tháng`}
            />
            <DetailItem
              label="Phí quản lý tòa nhà"
              value={listing.pricing?.managementFeeIncluded ? "Đã bao gồm trong giá" : "Tính riêng"}
            />
          </div>
        </SectionCard>

        {/* Section 6: Địa chỉ & Vị trí Bản đồ */}
        <SectionCard title="Địa chỉ & Vị trí" icon={MapPin}>
          <div className="space-y-4">
            <div role="list" className={DETAIL_GRID_CLASS}>
              <DetailItem label="Tỉnh / Thành phố" value={listing.address?.city} />
              <DetailItem label="Phường / Xã" value={listing.address?.ward} />
              <DetailItem label="Địa chỉ đường / Số nhà" value={listing.address?.street} />
              <DetailItem label="Địa chỉ hiển thị đầy đủ" value={fullAddress || undefined} />
            </div>

            {/* Google Maps Iframe */}
            {fullAddress && (
              <div className="h-72 overflow-hidden rounded-xl border border-border sm:h-80">
                <iframe
                  title="Google Maps Location"
                  src={mapsEmbedSrc(`${fullAddress}, Việt Nam`)}
                  className="h-full w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 7: Lịch xem phòng */}
        <SectionCard title="Lịch xem phòng sẵn sàng" icon={Calendar}>
          <div className="space-y-4">
            <div>
              <span className="block mb-2 text-sm font-medium text-muted-foreground">
                Ngày trong tuần có thể xem
              </span>
              <div className="flex flex-wrap gap-2">
                {listing.viewingDays && listing.viewingDays.length > 0 ? (
                  listing.viewingDays.map((day) => (
                    <span
                      key={day}
                      className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground"
                    >
                      {DAY_LABELS[day] || day}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Linh hoạt theo thỏa thuận trước.</span>
                )}
              </div>
            </div>

            <div>
              <span className="block mb-2 text-sm font-medium text-muted-foreground">
                Khung giờ tiếp khách
              </span>
              <div className="flex flex-wrap gap-2">
                {listing.viewingSlots && listing.viewingSlots.length > 0 ? (
                  listing.viewingSlots.map((slot) => (
                    <span
                      key={slot}
                      className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                    >
                      {SLOT_LABELS[slot] || slot}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Linh hoạt theo thỏa thuận trước.</span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 8: Mô tả chi tiết */}
        <SectionCard title="Mô tả chi tiết" icon={FileText}>
          <div
            className={`max-w-prose text-[15px] leading-7 text-foreground whitespace-pre-line ${
              (listing.description?.length ?? 0) > 600 && !descExpanded ? "line-clamp-[10]" : ""
            }`}
          >
            {listing.description || "Không có mô tả chi tiết."}
          </div>
          {(listing.description?.length ?? 0) > 600 && (
            <button
              type="button"
              aria-expanded={descExpanded}
              onClick={() => setDescExpanded((v) => !v)}
              className={`mt-3 rounded-md text-sm font-semibold text-primary hover:underline ${focusRing}`}
            >
              {descExpanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </SectionCard>

        {/* Section 9 (Admin Only): Timeline Lịch sử trạng thái */}
        {Boolean(listing.policies?.length) && <SectionCard title="Nội quy & Điều kiện thuê" icon={ShieldCheck}>
          <div role="list" className={DETAIL_GRID_CLASS}>
            {listing.policies?.map(policy => <DetailItem key={policy.code} label={policy.label} value={policy.displayValue} />)}
          </div>
        </SectionCard>}

        <SectionCard title={`Lịch sử trạng thái & Quản trị (${statusHistory.length})`} icon={History}>
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">ID Tin</dt>
                <dd className="mt-1 font-mono text-xs break-all text-foreground">{listing.id}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Phiên bản</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">v{listing.version}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Ngày tạo</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(listing.createdAt)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Cập nhật</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(listing.updatedAt)}</dd>
              </div>
            </dl>

            <ListingStatusHistoryTimeline
              history={statusHistory}
              currentUserId={userId}
              formatDate={formatDate}
            />
          </div>
        </SectionCard>
        </div>

      {/* Moderation Action Dialog */}
      <ListingModerationDialog
        key={`${listing.id}:${data.pendingEditId ?? "status"}:${moderationTarget}`}
        isOpen={Boolean(moderationTarget)}
        listing={listing}
        pendingEditId={data.pendingEditId}
        targetStatus={moderationTarget}
        onClose={() => setModerationTarget(null)}
        onSuccess={handleModerationSuccess}
      />
    </div>
  );
}
