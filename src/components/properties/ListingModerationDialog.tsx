import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  LoaderCircle,
  X,
} from "lucide-react";
import type {
  AdminListingSummaryResponse,
  ListingDetailResponse,
  ListingStatus,
} from "@/types/listing.type";
import { getListingStatusConfig } from "@/config/listing-status.config";
import adminListingService from "@/services/admin-listing.service";
import { getApiErrorMessage } from "@/utils/apiError";

interface ListingModerationDialogProps {
  isOpen: boolean;
  listing: AdminListingSummaryResponse | ListingDetailResponse | null;
  targetStatus: ListingStatus | null;
  onClose: () => void;
  onSuccess: (updatedStatus: ListingStatus) => void;
}

const DIALOG_TITLES: Record<
  string,
  { title: string; subtitle: string; icon: React.ReactNode; btnClass: string; btnLabel: string }
> = {
  PUBLISHED: {
    title: "Phê duyệt tin đăng",
    subtitle: "Tin đăng sẽ được duyệt và công khai hiển thị trên trang tìm kiếm phòng.",
    icon: <CheckCircle className="h-6 w-6 text-emerald-500" />,
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    btnLabel: "Duyệt tin đăng",
  },
  REJECTED: {
    title: "Từ chối duyệt tin đăng",
    subtitle: "Vui lòng nhập lý do từ chối cụ thể để người đăng biết và chỉnh sửa lại.",
    icon: <XCircle className="h-6 w-6 text-rose-500" />,
    btnClass: "bg-rose-600 hover:bg-rose-700 text-white",
    btnLabel: "Xác nhận từ chối",
  },
  HIDDEN: {
    title: "Tạm ẩn bài đăng",
    subtitle: "Bài đăng sẽ được ẩn khỏi kết quả tìm kiếm công khai.",
    icon: <EyeOff className="h-6 w-6 text-amber-500" />,
    btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
    btnLabel: "Ẩn bài đăng",
  },
  VIOLATION: {
    title: "Khóa tin đăng do Vi phạm",
    subtitle: "Khóa bài đăng do vi phạm quy định cộng đồng. Chủ tin sẽ không thể tự đăng lại.",
    icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    btnLabel: "Khóa tin vi phạm",
  },
  PENDING_REVIEW: {
    title: "Chuyển về chờ duyệt",
    subtitle: "Đưa bài đăng trở lại trạng thái chờ duyệt để kiểm tra lại.",
    icon: <RotateCcw className="h-6 w-6 text-amber-500" />,
    btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
    btnLabel: "Chuyển chờ duyệt",
  },
};

export default function ListingModerationDialog({
  isOpen,
  listing,
  targetStatus,
  onClose,
  onSuccess,
}: ListingModerationDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !listing || !targetStatus) return null;

  const isReasonRequired =
    targetStatus === "REJECTED" ||
    targetStatus === "HIDDEN" ||
    targetStatus === "VIOLATION";

  const dialogMeta = DIALOG_TITLES[targetStatus] || {
    title: `Thay đổi trạng thái sang ${getListingStatusConfig(targetStatus).label}`,
    subtitle: "Xác nhận thay đổi trạng thái cho bài đăng này.",
    icon: <AlertTriangle className="h-6 w-6 text-primary" />,
    btnClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
    btnLabel: "Xác nhận",
  };

  function handleClose() {
    setReason("");
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing || !targetStatus) return;

    if (isReasonRequired && !reason.trim()) {
      setErrorMessage("Vui lòng nhập lý do cụ thể trước khi xác nhận.");
      return;
    }

    if (reason.length > 2000) {
      setErrorMessage("Lý do không được vượt quá 2000 ký tự.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await adminListingService.changeStatus(listing.id, targetStatus, reason);
      setReason("");
      setErrorMessage(null);
      setIsSubmitting(false);
      onSuccess(targetStatus);
    } catch (error: unknown) {
      console.error("Moderation error:", error);
      const msg = getApiErrorMessage(error, "Không thể cập nhật trạng thái bài đăng. Vui lòng thử lại.");
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3.5 pr-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/60">
              {dialogMeta.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{dialogMeta.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{dialogMeta.subtitle}</p>
            </div>
          </div>

          {/* Listing Brief Card */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-1">
            <p className="text-xs font-bold text-foreground line-clamp-1">{listing.title}</p>
            <p className="text-[11px] text-muted-foreground">
              Chủ tin: <span className="font-semibold text-foreground">{listing.owner?.displayName || "—"}</span>
              {listing.owner?.phone && ` (${listing.owner.phone})`}
              {("fullAddress" in listing && listing.fullAddress)
                ? ` • ${listing.fullAddress}`
                : ("address" in listing && listing.address?.fullAddress)
                ? ` • ${listing.address.fullAddress}`
                : ""}
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>
                Lý do {isReasonRequired && <span className="text-rose-500">*</span>}
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {reason.length}/2000 ký tự
              </span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={
                isReasonRequired
                  ? "Ví dụ: Hình ảnh mờ, thông tin giá không đúng thực tế, hoặc nội dung vi phạm chính sách..."
                  : "Ghi chú thêm nếu có..."
              }
              maxLength={2000}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl border border-border px-4 text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (isReasonRequired && !reason.trim())}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${dialogMeta.btnClass}`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>{dialogMeta.btnLabel}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
