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
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as {
      code?: string | number;
      message?: string;
      errors?: ApiValidationErrorItem[];
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
  }

  // 3. Check error.message
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // 4. Default message in Vietnamese
  return defaultMessage;
}
