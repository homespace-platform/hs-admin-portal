import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";
import ListingStatusBadge from "@/components/properties/ListingStatusBadge";
import ListingModerationDialog from "@/components/properties/ListingModerationDialog";
import ListingStatusHistoryTimeline from "@/components/properties/ListingStatusHistoryTimeline";
import AdminMediaViewer from "@/components/properties/AdminMediaViewer";
import UserAvatar from "@/components/common/UserAvatar";
import { useAuth } from "@/features/auth/useAuth";
import adminListingService from "@/services/admin-listing.service";
import { getApiErrorMessage } from "@/utils/apiError";
import type {
  AdminListingDetailResponse,
  ListingCategory,
  ListingStatus,
} from "@/types/listing.type";
import {
  CATEGORY_NAMES,
  SUBTYPE_NAMES,
  RENTAL_MODE_NAMES,
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
}: {
  label: string;
  value?: React.ReactNode;
  highlight?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className={`font-semibold ${highlight ? "text-primary text-sm font-bold" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  stepNumber,
  children,
}: {
  title: string;
  stepNumber?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
        {stepNumber != null && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {stepNumber}
          </span>
        )}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function PropertyViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const listingId = searchParams.get("id");

  const [data, setData] = useState<AdminListingDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [error, setError] = useState(
    !listingId ? "Không tìm thấy mã tin đăng trong đường dẫn." : ""
  );

  // Moderation Dialog State
  const [moderationTarget, setModerationTarget] = useState<ListingStatus | null>(null);

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
    listing.address?.fullAddress ||
    [listing.address?.streetLine, listing.address?.wardName, listing.address?.provinceName]
      .filter(Boolean)
      .join(", ");

  const isPendingReview = listing.status === "PENDING_REVIEW";
  const isPublished = listing.status === "PUBLISHED";

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
      {/* Top Breadcrumbs & Moderation Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/properties/pending" className="hover:text-foreground transition-colors">
              Quản lý tin
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
              {listing.title}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
              {CATEGORY_ICONS[listing.category]}
              {CATEGORY_NAMES[listing.category] || listing.category}
            </span>
            <ListingStatusBadge status={listing.status} />
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted shadow-2xs transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách tin
          </button>

          {/* Pending Review Actions */}
          {isPendingReview && (
            <>
              <button
                type="button"
                onClick={() => setModerationTarget("REJECTED")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => setModerationTarget("PUBLISHED")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all"
              >
                <CheckCircle className="h-4 w-4" />
                Phê duyệt
              </button>
            </>
          )}

          {/* Published Actions */}
          {isPublished && (
            <>
              <button
                type="button"
                onClick={() => setModerationTarget("RENTED_EXTERNALLY")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-3.5 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Cho thuê ngoài hệ thống
              </button>
              <button
                type="button"
                onClick={() => setModerationTarget("HIDDEN")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
              >
                <EyeOff className="h-4 w-4" />
                Ẩn tin
              </button>
              <button
                type="button"
                onClick={() => setModerationTarget("VIOLATION")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition-all"
              >
                <AlertTriangle className="h-4 w-4" />
                Khóa vi phạm
              </button>
            </>
          )}

          {/* Switch between the two rented states without a full re-review */}
          {listing.status === "RENTED" && (
            <button
              type="button"
              onClick={() => setModerationTarget("RENTED_EXTERNALLY")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-3.5 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Cho thuê ngoài hệ thống
            </button>
          )}

          {listing.status === "VIOLATION" && (
            <>
              <button
                type="button"
                onClick={() => setModerationTarget("PENDING_REVIEW")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
              >
                <Unlock className="h-4 w-4" />
                Mở khóa
              </button>
              <button
                type="button"
                onClick={() => setModerationTarget("PUBLISHED")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all"
              >
                <CheckCircle className="h-4 w-4" />
                Hiển thị lại
              </button>
            </>
          )}

          {/* Re-open if rejected, hidden or already rented */}
          {(listing.status === "REJECTED" ||
            listing.status === "HIDDEN" ||
            listing.status === "EXPIRED" ||
            listing.status === "RENTED" ||
            listing.status === "RENTED_EXTERNALLY") && (
            <button
              type="button"
              onClick={() => setModerationTarget("PENDING_REVIEW")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-4 w-4 text-amber-500" />
              Chuyển chờ duyệt
            </button>
          )}
        </div>
      </div>

      {/* Hero Overview & Media Gallery */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Gallery column */}
        <div className="lg:col-span-7">
          <AdminMediaViewer media={listing.media || []} title={listing.title} />
        </div>

        {/* Quick summary & 4 KPI Cards */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                {listing.title}
              </h1>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>{fullAddress || "Chưa có thông tin địa chỉ"}</span>
              </p>
            </div>

            {/* Status Reason if Rejected or Violation */}
            {listing.statusReason && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">Lý do: </span>
                  <span>{listing.statusReason}</span>
                </div>
              </div>
            )}

            {/* 4 KPI Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Giá cho thuê</span>
                <p className="mt-1 text-base sm:text-lg font-bold text-primary">
                  {formatCurrency(listing.pricing?.amount)} ₫
                  <span className="text-xs font-normal text-muted-foreground">
                    /{PRICING_UNIT_NAMES[listing.pricing?.unit || "MONTH"] || "tháng"}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Diện tích</span>
                <p className="mt-1 text-base sm:text-lg font-bold text-foreground">
                  {listing.areaM2} <span className="text-xs font-normal text-muted-foreground">m²</span>
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Tiền đặt cọc</span>
                <p className="mt-1 text-sm sm:text-base font-bold text-foreground truncate">
                  {listing.pricing?.depositType === "NONE"
                    ? "Không đặt cọc"
                    : listing.pricing?.depositType === "NEGOTIABLE"
                    ? "Thương lượng"
                    : listing.pricing?.depositAmount
                    ? `${formatCurrency(listing.pricing.depositAmount)} ₫`
                    : listing.pricing?.depositMonths
                    ? `${listing.pricing.depositMonths} tháng tiền thuê`
                    : DEPOSIT_TYPE_NAMES[listing.pricing?.depositType || ""] || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Ngày vào ở</span>
                <p className="mt-1 text-sm sm:text-base font-bold text-foreground truncate">
                  {listing.availableFrom ? formatDate(listing.availableFrom) : "Ở ngay"}
                </p>
              </div>
            </div>

            {/* Landlord Profile Box */}
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Chủ bài đăng</span>
              </span>
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={listing.owner?.avatarUrl}
                  name={listing.owner?.displayName || "Chủ nhà"}
                  sizeClassName="w-11 h-11 text-sm font-bold shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    {listing.owner?.displayName || "Chủ nhà HomeSpace"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">ID: {listing.ownerId}</p>
                  {listing.owner?.phone && (
                    <a
                      href={`tel:${listing.owner.phone}`}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{listing.owner.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Detailed Sections */}
      <div className="space-y-6">
        {/* Section 1: Thông tin cơ bản */}
        <SectionCard title="Thông tin cơ bản" stepNumber={1}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Mã tin đăng" value={<span className="font-mono">{listing.id}</span>} />
            <DetailItem label="Loại hình" value={CATEGORY_NAMES[listing.category] || listing.category} />
            <DetailItem label="Phân loại chi tiết" value={SUBTYPE_NAMES[listing.subtype] || listing.subtype} />
            <DetailItem
              label="Hình thức cho thuê"
              value={RENTAL_MODE_NAMES[listing.rentalMode] || listing.rentalMode}
            />
            <DetailItem
              label="Thương lượng giá"
              value={listing.pricing?.negotiable ? "Có thể thương lượng" : "Giá cố định"}
            />
            <DetailItem
              label="Bao gồm phí quản lý"
              value={listing.pricing?.managementFeeIncluded ? "Đã bao gồm trong giá thuê" : "Chưa bao gồm"}
            />
          </div>
        </SectionCard>

        {/* Section 2: Chi tiết theo loại hình */}
        {listing.category === "APARTMENT" && listing.apartmentDetail && (
          <SectionCard title="Chi tiết căn hộ / chung cư" stepNumber={2}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <SectionCard title="Chi tiết nhà ở nguyên căn" stepNumber={2}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </SectionCard>
        )}

        {listing.category === "OFFICE" && listing.officeDetail && (
          <SectionCard title="Chi tiết văn phòng" stepNumber={2}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <SectionCard title="Chi tiết mặt bằng kinh doanh" stepNumber={2}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </SectionCard>
        )}

        {listing.category === "ROOM" && listing.roomDetail && (
          <SectionCard title="Chi tiết nhà trọ / phòng cho thuê" stepNumber={2}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Mã / Số phòng" value={listing.roomDetail.roomCode} />
              <DetailItem label="Tầng số" value={listing.roomDetail.floorNumber} />
              <DetailItem
                label="Nhà vệ sinh"
                value={RESTROOM_TYPE_NAMES[listing.roomDetail.restroomType || ""] || (listing.roomDetail.restroomType === "PRIVATE" ? "Vệ sinh khép kín riêng" : "Vệ sinh chung ngoài phòng")}
              />
              <DetailItem
                label="Khu vực nấu ăn"
                value={KITCHEN_TYPE_NAMES[listing.roomDetail.kitchenType || ""] || (listing.roomDetail.kitchenType === "PRIVATE" ? "Kệ bếp riêng trong phòng" : listing.roomDetail.kitchenType === "SHARED" ? "Khu bếp chung" : "Không cho nấu ăn")}
              />
              <DetailItem label="Cửa sổ thoáng mát" value={listing.roomDetail.hasWindow ? "Có cửa sổ" : "Không có cửa sổ"} />
              <DetailItem label="Ban công riêng" value={listing.roomDetail.hasBalcony ? "Có ban công riêng" : "Không"} />
              <DetailItem label="Gác lửng / Gác xép" value={listing.roomDetail.hasMezzanine ? "Có gác xép" : "Không"} />
              <DetailItem
                label="Tình trạng nội thất"
                value={FURNISHING_NAMES[listing.roomDetail.furnishingStatus || ""] || listing.roomDetail.furnishingStatus}
              />
              <DetailItem label="Số người ở tối đa" value={`${listing.roomDetail.maxOccupants} người`} />
              <DetailItem label="Số lượng xe tối đa" value={listing.roomDetail.maxVehicles ? `${listing.roomDetail.maxVehicles} xe` : undefined} />
              <DetailItem
                label="Lối đi sử dụng"
                value={ACCESS_TYPE_NAMES[listing.roomDetail.accessType || ""] || listing.roomDetail.accessType}
              />
              <DetailItem
                label="Giờ giấc sinh hoạt"
                value={OPERATING_MODE_NAMES[listing.roomDetail.accessHoursType || ""] || listing.roomDetail.accessHoursType}
              />
              <DetailItem
                label="Đồng hồ điện"
                value={METER_TYPE_NAMES[listing.roomDetail.electricMeterType || ""] || listing.roomDetail.electricMeterType}
              />
              <DetailItem
                label="Đồng hồ nước"
                value={METER_TYPE_NAMES[listing.roomDetail.waterMeterType || ""] || listing.roomDetail.waterMeterType}
              />
              <DetailItem
                label="Chính sách chỗ để xe"
                value={PARKING_NAMES[listing.roomDetail.parkingPolicy || ""] || listing.roomDetail.parkingPolicy}
              />
            </div>
          </SectionCard>
        )}

        {/* Section 3: Tiện ích & Trang bị nội thất */}
        <SectionCard title="Tiện ích & Trang bị nội thất" stepNumber={3}>
          <div className="space-y-4">
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Tiện ích sẵn có ({listing.amenities.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((item) => (
                    <span
                      key={item.code}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {listing.furnishings && listing.furnishings.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Trang bị nội thất ({listing.furnishings.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.furnishings.map((item) => (
                    <span
                      key={item.code}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(!listing.amenities || listing.amenities.length === 0) &&
              (!listing.furnishings || listing.furnishings.length === 0) && (
                <p className="text-xs text-muted-foreground italic">Không có thông tin tiện ích bổ sung.</p>
              )}
          </div>
        </SectionCard>

        {/* Section 4: Biểu phí & Chi phí hàng tháng */}
        <SectionCard title="Biểu phí & Chi phí dịch vụ hàng tháng" stepNumber={4}>
          {listing.charges && listing.charges.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listing.charges.map((charge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {charge.customName || CHARGE_TYPE_NAMES[charge.chargeType] || charge.chargeType}
                    </span>
                    {charge.includedInRent ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Miễn phí / Đã bao gồm
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        Tính phí
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-primary">
                    {formatChargeFee(charge, formatCurrency)}
                  </p>
                  {charge.description && (
                    <p className="text-[11px] text-muted-foreground">{charge.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Không có biểu phí dịch vụ phát sinh riêng.</p>
          )}
        </SectionCard>

        {/* Section 5: Giá thuê & Điều kiện hợp đồng */}
        <SectionCard title="Giá thuê & Điều kiện hợp đồng" stepNumber={5}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  : listing.pricing?.depositType === "NEGOTIABLE"
                  ? "Thương lượng / Thỏa thuận"
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
              label="Thuế VAT"
              value={listing.pricing?.vatIncluded ? "Đã bao gồm VAT" : "Chưa bao gồm VAT"}
            />
            <DetailItem
              label="Phí quản lý tòa nhà"
              value={listing.pricing?.managementFeeIncluded ? "Đã bao gồm trong giá" : "Tính riêng"}
            />
          </div>
        </SectionCard>

        {/* Section 6: Địa chỉ & Vị trí Bản đồ */}
        <SectionCard title="Địa chỉ & Vị trí" stepNumber={6}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <DetailItem label="Tỉnh / Thành phố" value={listing.address?.provinceName} />
              <DetailItem label="Phường / Xã" value={listing.address?.wardName} />
              <DetailItem label="Địa chỉ đường / Số nhà" value={listing.address?.streetLine} />
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs">
              <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                Địa chỉ hiển thị đầy đủ:
              </span>
              <span className="font-bold text-foreground">{fullAddress || "Chưa có thông tin"}</span>
            </div>

            {/* Google Maps Iframe */}
            {fullAddress && (
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  title="Google Maps Location"
                  src={mapsEmbedSrc(`${fullAddress}, Việt Nam`)}
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 7: Lịch xem phòng */}
        <SectionCard title="Lịch xem phòng sẵn sàng" stepNumber={7}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Ngày trong tuần có thể xem:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {listing.viewingDays && listing.viewingDays.length > 0 ? (
                  listing.viewingDays.map((day) => (
                    <span
                      key={day}
                      className="rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-foreground"
                    >
                      {DAY_LABELS[day] || day}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Linh hoạt theo thỏa thuận trước.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Khung giờ tiếp khách:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {listing.viewingSlots && listing.viewingSlots.length > 0 ? (
                  listing.viewingSlots.map((slot) => (
                    <span
                      key={slot}
                      className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
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
        <SectionCard title="Mô tả chi tiết" stepNumber={8}>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
            {listing.description || "Không có mô tả chi tiết."}
          </div>
        </SectionCard>

        {/* Section 9 (Admin Only): Timeline Lịch sử trạng thái */}
        <SectionCard title={`Lịch sử trạng thái & Quản trị (${statusHistory.length})`}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pb-2 border-b border-border/60">
              <span>ID Tin: <span className="font-mono font-semibold text-foreground">{listing.id}</span></span>
              <span>Phiên bản: <span className="font-semibold text-foreground">v{listing.version}</span></span>
              <span>Ngày tạo: <span className="font-semibold text-foreground">{formatDate(listing.createdAt)}</span></span>
              <span>Cập nhật: <span className="font-semibold text-foreground">{formatDate(listing.updatedAt)}</span></span>
            </div>

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
        isOpen={Boolean(moderationTarget)}
        listing={listing}
        targetStatus={moderationTarget}
        onClose={() => setModerationTarget(null)}
        onSuccess={handleModerationSuccess}
      />
    </div>
  );
}
