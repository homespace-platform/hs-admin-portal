export function formatRoleLabel(name?: string | null): string {
  if (name === "ADMIN") return "Quản trị viên";
  if (name === "USER") return "Người dùng";
  return name || "Chưa đặt tên";
}
