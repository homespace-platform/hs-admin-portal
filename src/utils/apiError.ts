import axios from "axios";

export interface ApiValidationErrorItem {
  field?: string;
  code?: string;
  message: string;
}

const API_ERROR_MESSAGES: Record<string, string> = {
  NEW_PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu mới.",
  PASSWORD_TOO_SHORT: "Mật khẩu phải có ít nhất 8 ký tự.",
  PASSWORD_WEAK:
    "Mật khẩu phải gồm ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt.",
};

// Backend ApiResponse carries the numeric business code in `code` (hs-user-service UserErrorCode / ErrorCode).
const API_ERROR_CODE_MESSAGES: Record<number, string> = {
  1003: "Bạn không có quyền thực hiện thao tác này.", // ErrorCode.UNAUTHORIZED (ownership/business denial, gateway)
  1009: "Bạn không có quyền thực hiện thao tác này.", // ErrorCode.PERMISSION_DENIED (method-security AccessDenied)
  2017: "Bạn không thể khóa tài khoản đang đăng nhập.",
  2018: "Bạn không thể tự đổi vai trò của tài khoản đang đăng nhập.",
  2019: "Không thể khóa/hạ quyền quản trị viên cuối cùng.",
  2020: "Bạn không thể chỉnh sửa người dùng đang nắm quyền mà bạn không có.",
  2103: "Bộ quyền của vai trò ADMIN bị khóa, không thể thay đổi.",
  2104: "Vai trò USER chỉ được cấp quyền tính năng người dùng", // UserErrorCode.ROLE_PERMISSION_SCOPE_INVALID
  2203: "Bạn không thể cấp quyền mà chính bạn không có.",
};
export const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

/** Friendly Vietnamese text for known admin/RBAC codes and plain 403s; null when the server message should be used. */
export function knownApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error) || !error.response) return null;
  const data = error.response.data as { code?: unknown } | undefined;
  const raw = data?.code;
  const code = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
  // Broadcast reuses code 2019 for its own idempotency conflict; keep that server message.
  if (code === 2019 && error.config?.url?.includes("/admin/broadcast")) return null;
  if (Number.isInteger(code) && API_ERROR_CODE_MESSAGES[code]) return API_ERROR_CODE_MESSAGES[code];
  // A 403 without a specific business code (e.g. gateway or missing permission) gets the generic text.
  if (error.response.status === 403 && !Number.isInteger(code)) return FORBIDDEN_MESSAGE;
  return null;
}

function translateApiErrorMessage(message: string) {
  return API_ERROR_MESSAGES[message] ?? message;
}

/**
 * Trích xuất thông báo lỗi từ response API theo thứ tự ưu tiên:
 * 1. response.data.errors (dạng danh sách validation errors)
 * 2. response.data.message
 * 3. error.message
 * 4. Thông báo mặc định tiếng Việt
 */
export function getApiErrorMessage(
  error: unknown,
  defaultMessage = "Đã xảy ra lỗi, vui lòng thử lại."
): string {
  const known = knownApiErrorMessage(error);
  if (known) return known;

  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as {
      code?: string | number;
      message?: string;
      errors?: ApiValidationErrorItem[];
      detail?: string | Array<{ msg?: string }>;
    };

    // 1. Check response.data.errors
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((err) => translateApiErrorMessage(err.message))
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join("; ");
      }
    }

    // 2. Check response.data.message
    if (data.message && typeof data.message === "string" && data.message.trim()) {
      return translateApiErrorMessage(data.message.trim());
    }
    if (typeof data.detail === "string" && data.detail.trim()) return data.detail.trim();
    if (Array.isArray(data.detail)) {
      const details = data.detail.map((item) => item.msg).filter(Boolean);
      if (details.length) return details.join("; ");
    }
  }

  // 3. Check error.message
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // 4. Default message in Vietnamese
  return defaultMessage;
}
