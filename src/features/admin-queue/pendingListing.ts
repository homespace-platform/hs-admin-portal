import type { AdminListingSummaryResponse } from "@/types/listing.type";
import type { AdminAccess } from "./adminAccess";

export const isPendingEdit = (item: Pick<AdminListingSummaryResponse, "pendingEditId">) =>
  Boolean(item.pendingEditId);

/** Same detail route the rest of the admin uses; the id is always encoded. */
export const pendingListingHref = (id: string) => `/properties/view?id=${encodeURIComponent(id)}`;

export const pendingKindLabel = (item: Pick<AdminListingSummaryResponse, "pendingEditId">) =>
  isPendingEdit(item) ? "Bản chỉnh sửa chờ duyệt" : "Tin đăng mới chờ duyệt";

export function formatSubmittedAt(value: string | null | undefined): string {
  if (!value) return "Chưa có thời gian gửi";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "Chưa có thời gian gửi"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(d);
}

/** Why the queue cannot be listed (null when it can). Shared by the bell and the center. */
export function queueBlockedMessage(enabled: boolean, access: AdminAccess, denied: boolean): string | null {
  if (!enabled) return "Cảnh báo hàng chờ duyệt đã tắt.";
  if (access === "loading") return "Đang xác thực quyền quản trị viên...";
  if (access === "profile-error") return "Không thể xác thực quyền quản trị viên. Hãy tải lại trang.";
  if (access === "signed-out") return "Phiên đăng nhập không còn hiệu lực.";
  if (access === "forbidden" || denied) return "Không có quyền xem hàng chờ duyệt.";
  return null;
}
