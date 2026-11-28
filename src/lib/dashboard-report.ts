import type { MetricObject } from "@/services/admin-dashboard.service";

/** Preserve decimal/large tokens outside JSON strings before JavaScript rounds them. */
export function parseDashboardResponse(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const preserved = raw.replace(
    /"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (token) =>
      token.startsWith('"') ||
      (!/[.eE]/.test(token) && Number.isSafeInteger(Number(token)))
        ? token
        : JSON.stringify(token),
  );
  return JSON.parse(preserved);
}

/** Spreadsheet applications evaluate formula prefixes even after leading whitespace. */
export function csvField(value: unknown): string {
  const text = value == null ? "" : String(value);
  const first = Array.from(text).find(
    (character) => character.charCodeAt(0) > 32 && !/\s/u.test(character),
  );
  const safe = first && "=+-@".includes(first) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function explorerLink(
  chainId: number,
  hash: string | null,
): string | null {
  return chainId === 11155111 && hash && /^0x[0-9a-f]{64}$/i.test(hash)
    ? `https://sepolia.etherscan.io/tx/${hash}`
    : null;
}

export function statisticsRangeError(
  from: string,
  to: string,
  granularity: string,
): string | null {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > end ||
    new Date(start).toISOString().slice(0, 10) !== from ||
    new Date(end).toISOString().slice(0, 10) !== to
  )
    return "Chọn ngày bắt đầu và kết thúc hợp lệ.";
  if (granularity === "DAY" && (end - start) / 86400000 + 1 > 92)
    return "Theo ngày hỗ trợ tối đa 92 ngày.";
  const months =
    (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
    Number(to.slice(5, 7)) -
    Number(from.slice(5, 7)) +
    1;
  if (granularity === "MONTH" && months > 36)
    return "Theo tháng hỗ trợ tối đa 36 tháng.";
  return null;
}

export function count(value: unknown) {
  if (typeof value === "number")
    return Number.isFinite(value)
      ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
          value,
        )
      : "—";
  if (typeof value !== "string") return "—";
  let decimal = value;
  const scientific = /^(-?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(decimal);
  if (scientific) {
    const [, sign, integer, fraction = "", exponent] = scientific;
    const digits = integer + fraction;
    const point = integer.length + Number(exponent);
    if (Math.abs(point) > 1000) return decimal;
    decimal =
      sign +
      (point <= 0
        ? `0.${"0".repeat(-point)}${digits}`
        : point >= digits.length
          ? digits + "0".repeat(point - digits.length)
          : `${digits.slice(0, point)}.${digits.slice(point)}`);
  }
  if (!/^-?\d+(\.\d+)?$/.test(decimal)) return "—";
  const [whole, fraction] = decimal.split(".");
  const integer = BigInt(whole);
  return (
    (whole.startsWith("-") && integer === 0n ? "-" : "") +
    new Intl.NumberFormat("vi-VN").format(integer) +
    (fraction ? `,${fraction}` : "")
  );
}
export function money(value: unknown) {
  const formatted = count(value);
  return formatted === "—" ? formatted : `${formatted} ₫`;
}
export function age(value: unknown) {
  const seconds = Number(value);
  if (value == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
  return `${Math.floor(seconds / 86400)} ngày`;
}
export function dateTime(value: string | null | undefined) {
  return value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";
}
export function object(value: unknown): MetricObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as MetricObject)
    : null;
}
export const LABELS: Record<string, string> = {
  OK: "Ổn định",
  UP: "Đang hoạt động",
  DOWN: "Mất kết nối",
  WARN: "Cần chú ý",
  ERROR: "Có lỗi",
  UNKNOWN: "Chưa xác định",
  DEGRADED: "Gián đoạn một phần",
  PENDING: "Đang chờ",
  SUBMITTED: "Đã gửi",
  CONFIRMED: "Đã xác nhận",
  FAILED: "Thất bại",
  MATCH: "Khớp",
  MISMATCH: "Không khớp",
  MISSING: "Thiếu tệp",
  UNAVAILABLE: "Chưa khả dụng",
  UNCHECKED: "Chưa kiểm tra",
  NOT_AVAILABLE: "Chưa có dữ liệu",
  AVAILABLE: "Khả dụng",
  VERIFIED: "Đã xác minh",
  REVIEW_REQUIRED: "Cần xem xét",
  EXPIRED: "Hết hạn",
  NOT_VERIFIED: "Chưa xác minh",
  REJECTED: "Từ chối",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã huỷ",
  REVIEW: "Cần đối soát",
  PUBLISHED: "Đang hiển thị",
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  RESERVED: "Đang giữ chỗ",
  RENTED: "Đã cho thuê",
  HIDDEN: "Đã ẩn",
  VIOLATION: "Vi phạm",
  RENTED_EXTERNALLY: "Cho thuê bên ngoài",
  ACTIVE: "Đang hiệu lực",
  CLOSED: "Đã kết thúc",
  TERMINATED: "Đã chấm dứt",
  SIGNED: "Đã ký",
  LEASE: "Thuê nhà",
  DEPOSIT: "Đặt cọc",
  ADDENDUM: "Phụ lục",
  LEGACY_UNSPECIFIED: "Chưa phân loại",
  OTHER: "Khác",
  VNPT: "VNPT eKYC",
  ADMIN: "Thủ công",
  MANUAL: "Thủ công",
  DUPLICATE_ID: "Trùng giấy tờ",
  DOCUMENT_OR_FACE: "Giấy tờ hoặc khuôn mặt",
  INITIAL: "Thanh toán ban đầu",
  MONTHLY_RENT: "Tiền thuê tháng",
  UTILITY: "Điện nước",
  OTHER_CHARGE: "Khoản khác",
  RESERVATION_DEPOSIT: "Giữ chỗ",
  ACCEPTED: "Chấp nhận",
  COMPLETED: "Đã qua lịch hẹn",
  CANCELLED_BY_SYSTEM: "Hệ thống huỷ",
};
export function label(value: string) {
  return LABELS[value] ?? value;
}
