import { useLocation, Link } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  HelpCircle,
  Bell,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuth } from "@/features/auth/useAuth";

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Route mapping for dynamic breadcrumbs
const ROUTE_NAMES: Record<string, string> = {
  "/": "Bảng điều khiển",
  "/dashboard": "Bảng điều khiển",
  "/properties/pending": "BĐS chờ duyệt",
  "/properties/approved": "BĐS đã duyệt",
  "/properties/rejected": "BĐS từ chối",
  "/users/members": "Người dùng hệ thống",
  "/users/admins": "Quản trị viên",
  "/operations/complaints": "Xử lý khiếu nại",
  "/operations/news": "Quản lý tin tức",
  "/blockchain": "Blockchain Explorer",
  "/analytics/statistics": "Thống kê số liệu",
  "/analytics/ai-forecast": "Dự báo & AI",
  "/settings": "Cài đặt hệ thống",
};

export default function Header({ collapsed, onToggleCollapse }: HeaderProps) {
  const location = useLocation();
  const { fullName, role, avatarUrl } = useAuth();

  const currentTitle = ROUTE_NAMES[location.pathname] || "Bảng điều khiển";

  return (
    <header className="h-20 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors select-none shadow-2xs">
      {/* 1. Left: Toggle Sidebar + Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-primary" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="hover:text-foreground transition-colors">Ứng dụng</span>
          <span>/</span>
          <span className="text-foreground font-bold">{currentTitle}</span>
        </nav>
      </div>

      {/* 2. Right: Theme Toggle + Search + Help + Notifications + User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Search Bar */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 hover:bg-muted rounded-full border border-border focus:outline-none focus:border-primary text-foreground transition-all"
          />
        </div>

        {/* Help Button */}
        <button
          type="button"
          className="w-9 h-9 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          title="Trợ giúp & Hướng dẫn"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notification Bell with Badge */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          title="Thông báo hệ thống"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
            3
          </span>
        </button>

        {/* User Profile */}
        <Link
          to="/settings"
          className="flex items-center gap-2.5 pl-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs overflow-hidden border border-border shadow-xs">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-foreground leading-tight">
              {fullName}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {role}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
