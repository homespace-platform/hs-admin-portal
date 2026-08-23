import axios from "axios";

export function formatRole(role?: string | null): string {
  if (role === "ADMIN") return "Quản trị viên";
  if (role === "USER") return "Người dùng";
  return role || "Chưa phân vai trò";
}

export function formatGender(gender?: string | null): string {
  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nữ";
  if (gender === "OTHER") return "Khác";
  return "Chưa cập nhật";
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export type ParsedAuditActor = {
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
  email?: string | null;
  raw?: string | null;
};

export function parseAuditActor(
  actor?: {
    id?: string | null;
    fullName?: string | null;
    username?: string | null;
    phone?: string | null;
    email?: string | null;
  } | string | null,
): ParsedAuditActor | null {
  if (!actor) return null;

  if (typeof actor === "object") {
    return {
      fullName: actor.fullName,
      username: actor.username,
      phone: actor.phone,
      email: actor.email,
      raw: actor.id,
    };
  }

  if (typeof actor === "string") {
    const trimmed = actor.trim();
    if (trimmed.includes("|")) {
      const parts = trimmed.split("|").map((p) => p.trim());
      let fullName: string | undefined;
      let username: string | undefined;
      let phone: string | undefined;
      let email: string | undefined;

      for (const part of parts) {
        if (part.startsWith("@")) {
          username = part.replace(/^@/, "");
        } else if (part.includes("@")) {
          email = part;
        } else if (/^[0-9+() -]{8,}$/.test(part)) {
          phone = part;
        } else if (!fullName) {
          fullName = part;
        }
      }

      return { fullName, username, phone, email, raw: trimmed };
    }

    return { raw: trimmed };
  }

  return null;
}

export function formatAuditActor(
  actor?: {
    id?: string | null;
    fullName?: string | null;
    username?: string | null;
    phone?: string | null;
    email?: string | null;
  } | string | null,
): string {
  const parsed = parseAuditActor(actor);
  if (!parsed) return "N/A";
  const parts = [
    parsed.fullName,
    parsed.username ? `@${parsed.username}` : null,
    parsed.phone,
    parsed.email,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" | ") : parsed.raw || "N/A";
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { code?: number; message?: string } | undefined;
    if (data?.code === 2017) {
      return "Bạn không thể khóa tài khoản đang đăng nhập.";
    }
    if (data?.code === 2018) {
      return "Bạn không thể tự đổi vai trò của tài khoản đang đăng nhập.";
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
