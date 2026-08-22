import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const ROUTE_NAMES: Record<string, string> = {
  "/": "Bảng điều khiển",
  "/dashboard": "Bảng điều khiển",
  "/properties/pending": "Tin đăng chờ duyệt",
  "/properties/approved": "Tin đăng đã duyệt",
  "/properties/rejected": "Tin đăng từ chối",
  "/users/members": "Người dùng hệ thống",
  "/users/admins": "Quản trị viên",
  "/operations/complaints": "Xử lý khiếu nại",
  "/operations/news": "Quản lý tin tức",
  "/blockchain": "Blockchain Explorer",
  "/analytics/statistics": "Thống kê số liệu",
  "/analytics/ai-forecast": "Dự báo & AI",
  "/settings": "Cài đặt hệ thống",
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const currentTitle = ROUTE_NAMES[location.pathname] || "Bảng điều khiển";

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* 2. Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Header Bar */}
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Page Content Container with Breadcrumb below Header */}
        <div className="flex-1 p-6 lg:p-8 bg-slate-50/50 dark:bg-background overflow-x-hidden space-y-4">
          {/* Dynamic Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none">
            <Link
              to="/"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Ứng dụng</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-bold">{currentTitle}</span>
          </nav>

          {/* Page Outlet */}
          <main className="min-h-[70vh]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
