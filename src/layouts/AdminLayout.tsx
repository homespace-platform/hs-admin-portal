import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Breadcrumb, { type BreadcrumbItem } from "@/components/common/Breadcrumb";
import {
  BreadcrumbTitleProvider,
  useBreadcrumbTitleValue,
} from "@/components/common/BreadcrumbTitle";
import { SETTINGS_SECTIONS } from "@/components/settings/settings-nav";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ProfileReminder from "@/features/onboarding/ProfileReminder";
import { AdminQueueProvider } from "@/features/admin-queue/AdminQueueProvider";
import PersonalNotificationProvider from "@/features/notifications/PersonalNotificationProvider";

const ROOT: BreadcrumbItem = { label: "Tổng quan", href: "/dashboard" };
const LISTINGS: BreadcrumbItem = { label: "Quản lý tin đăng", href: "/properties" };
const NOTIFICATIONS: BreadcrumbItem = { label: "Thông báo", href: "/notifications" };
const TEMPLATES: BreadcrumbItem = { label: "Mẫu hợp đồng", href: "/contracts/templates" };
const NEWS: BreadcrumbItem = { label: "Quản lý tin tức", href: "/operations/news" };
const SETTINGS: BreadcrumbItem = { label: "Cài đặt", href: "/settings" };

// Trail after the root, keyed by exact path. Group labels without a page of their own
// (Quản lý tài khoản, Hợp đồng & đặt cọc, Vận hành & Hỗ trợ, Báo cáo & Phân tích) are omitted.
const TRAILS: Record<string, BreadcrumbItem[]> = {
  "/notifications": [{ label: "Thông báo" }],
  "/notifications/feed": [NOTIFICATIONS, { label: "Thông báo cá nhân" }],
  "/users": [{ label: "Người dùng hệ thống" }],
  "/users/members": [{ label: "Người dùng hệ thống" }],
  "/users/roles": [{ label: "Vai trò" }],
  "/users/permissions": [{ label: "Quyền hạn" }],
  "/properties": [{ label: "Quản lý tin đăng" }],
  "/properties/all": [LISTINGS, { label: "Tất cả tin đăng" }],
  "/properties/pending": [LISTINGS, { label: "Chờ duyệt" }],
  "/properties/approved": [LISTINGS, { label: "Đã duyệt" }],
  "/properties/draft": [LISTINGS, { label: "Tin nháp" }],
  "/properties/rented": [LISTINGS, { label: "Đã cho thuê" }],
  "/properties/rented-externally": [LISTINGS, { label: "Cho thuê ngoài hệ thống" }],
  "/properties/expired": [LISTINGS, { label: "Hết hạn" }],
  "/properties/rejected": [LISTINGS, { label: "Từ chối" }],
  "/properties/hidden": [LISTINGS, { label: "Đã ẩn" }],
  "/properties/violation": [LISTINGS, { label: "Vi phạm" }],
  "/properties/view": [
    LISTINGS,
    { label: "Tất cả tin đăng", href: "/properties/all" },
    { label: "Chi tiết tin đăng" },
  ],
  "/contracts": [{ label: "Mẫu hợp đồng" }],
  "/contracts/guide": [{ label: "Hướng dẫn hợp đồng" }],
  "/contracts/templates": [{ label: "Mẫu hợp đồng" }],
  "/contracts/fields": [{ label: "Từ điển mã trường" }],
  "/contracts/all": [{ label: "Hợp đồng hệ thống" }],
  "/operations": [{ label: "Xử lý khiếu nại" }],
  "/operations/complaints": [{ label: "Xử lý khiếu nại" }],
  "/operations/system-alerts": [{ label: "Cảnh báo vận hành" }],
  "/operations/news": [{ label: "Quản lý tin tức" }],
  "/operations/news/create": [NEWS, { label: "Tạo bài viết mới" }],
  "/operations/knowledge": [{ label: "Kho tri thức AI" }],
  "/operations/notifications": [{ label: "Thông báo hệ thống" }],
  "/blockchain": [{ label: "Blockchain Explorer" }],
  "/analytics": [{ label: "Thống kê số liệu" }],
  "/analytics/statistics": [{ label: "Thống kê số liệu" }],
  "/analytics/ai-forecast": [{ label: "Dự báo & AI" }],
  "/settings": [{ label: "Cài đặt" }],
};

/** Breadcrumb trail for the current admin path; mirrors src/router/index.tsx. */
function buildTrail(pathname: string): BreadcrumbItem[] {
  // react-router matches case-insensitively, so normalise before the lookups.
  const lower = pathname.toLowerCase();
  const path = lower.length > 1 ? lower.replace(/\/+$/, "") : lower;
  if (path === "/" || path === "/dashboard" || path === "/operations/nearby") return [{ label: ROOT.label }];

  const exact = TRAILS[path];
  if (exact) return [ROOT, ...exact];

  if (/^\/contracts\/templates\/[^/]+$/.test(path)) {
    return [ROOT, TEMPLATES, { label: "Chi tiết mẫu hợp đồng" }];
  }
  if (/^\/operations\/news\/[^/]+\/edit$/.test(path)) {
    return [ROOT, NEWS, { label: "Chỉnh sửa bài viết" }];
  }
  const section = SETTINGS_SECTIONS.find((s) => path === `/settings/${s.id}`);
  if (section) return [ROOT, SETTINGS, { label: section.label }];
  return [ROOT, { label: "Không tìm thấy trang" }];
}

function AdminBreadcrumb() {
  const { pathname } = useLocation();
  const title = useBreadcrumbTitleValue();
  const trail = buildTrail(pathname);
  const items =
    title && trail.length > 1
      ? [...trail.slice(0, -1), { label: title }]
      : trail;
  return <Breadcrumb items={items} />;
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AdminQueueProvider>
    <PersonalNotificationProvider>
    <BreadcrumbTitleProvider>
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
        <ProfileReminder />

        {/* Page Content Container with Breadcrumb below Header */}
        <div className="flex-1 p-6 lg:p-8 bg-slate-50/50 dark:bg-background overflow-x-clip space-y-4">
          <AdminBreadcrumb />

          {/* Page Outlet */}
          <main className="min-h-[70vh]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
    </BreadcrumbTitleProvider>
    </PersonalNotificationProvider>
    </AdminQueueProvider>
  );
}
