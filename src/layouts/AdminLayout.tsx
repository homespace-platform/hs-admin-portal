import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface BreadcrumbItem {
  parent?: { title: string; path?: string };
  title: string;
}

const BREADCRUMB_MAP: Record<string, BreadcrumbItem> = {
  "/": { title: "Tổng quan" },
  "/dashboard": {
    title: "Tổng quan",
  },
  "/properties": {
    title: "Quản lý tin đăng",
  },
  "/properties/all": {
    parent: { title: "Quản lý tin đăng", path: "/properties" },
    title: "Tất cả tin đăng",
  },
  "/properties/pending": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Chờ duyệt",
  },
  "/properties/approved": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Đã duyệt",
  },
  "/properties/draft": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Tin nháp",
  },
  "/properties/rented": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Đã cho thuê",
  },
  "/properties/rented-externally": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Cho thuê ngoài hệ thống",
  },
  "/properties/expired": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Hết hạn",
  },
  "/properties/rejected": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Từ chối",
  },
  "/properties/hidden": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Đã ẩn",
  },
  "/properties/violation": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Vi phạm",
  },
  "/properties/view": {
    parent: { title: "Quản lý tin đăng", path: "/properties/all" },
    title: "Chi tiết tin đăng",
  },
  "/users": {
    parent: { title: "Quản lý tài khoản", path: "/users" },
    title: "Người dùng hệ thống",
  },
  "/users/members": {
    parent: { title: "Quản lý tài khoản", path: "/users" },
    title: "Người dùng hệ thống",
  },
  "/users/roles": {
    parent: { title: "Quản lý tài khoản", path: "/users" },
    title: "Vai trò",
  },
  "/users/permissions": {
    parent: { title: "Quản lý tài khoản", path: "/users" },
    title: "Quyền hạn",
  },
  "/operations/complaints": {
    parent: { title: "Vận hành & Hỗ trợ", path: "/operations/complaints" },
    title: "Xử lý khiếu nại",
  },
  "/operations/news": {
    parent: { title: "Vận hành & Hỗ trợ", path: "/operations/complaints" },
    title: "Quản lý tin tức",
  },
  "/operations/news/create": {
    parent: { title: "Quản lý tin tức", path: "/operations/news" },
    title: "Tạo bài viết mới",
  },
  "/blockchain": {
    title: "Blockchain Explorer",
  },
  "/analytics/statistics": {
    parent: { title: "Báo cáo & Phân tích", path: "/analytics/statistics" },
    title: "Thống kê số liệu",
  },
  "/analytics/ai-forecast": {
    parent: { title: "Báo cáo & Phân tích", path: "/analytics/statistics" },
    title: "Dự báo & AI",
  },
  "/settings": {
    title: "Cài đặt",
  },
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const currentBreadcrumb = BREADCRUMB_MAP[location.pathname] || {
    title: "Tổng quan",
  };

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
          <nav className="flex items-center gap-2 text-xs font-semibold select-none">
            {currentBreadcrumb.parent ? (
              <>
                {currentBreadcrumb.parent.path ? (
                  <Link
                    to={currentBreadcrumb.parent.path}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {currentBreadcrumb.parent.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    {currentBreadcrumb.parent.title}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span className="text-foreground font-bold">
                  {currentBreadcrumb.title}
                </span>
              </>
            ) : (
              <span className="text-foreground font-bold">
                {currentBreadcrumb.title}
              </span>
            )}
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
