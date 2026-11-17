import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { usePersonalNotifications } from "@/features/notifications/personalNotificationContext";

export default function PersonalNotificationBell() {
  const { count, error } = usePersonalNotifications();
  return <Link to="/notifications/feed" aria-label={`Thông báo cá nhân${count === null ? "" : `: ${count} chưa đọc`}`}
    title={error ? "Chưa cập nhật được thông báo; mở để tải lại" : "Thông báo cá nhân"}
    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted">
    <Bell className="h-4 w-4" aria-hidden="true" />
    {count !== null && count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{count > 99 ? "99+" : count}</span>}
  </Link>;
}
