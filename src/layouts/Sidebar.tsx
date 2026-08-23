import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  Link2,
  TrendingUp,
  Settings,
  ChevronDown,
  FileCheck2,
  Clock,
  Ban,
  ShieldCheck,
  UserCheck,
  KeyRound,
  AlertTriangle,
  Newspaper,
  BarChart3,
  BrainCircuit,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ElementType;
  children?: { title: string; path: string; icon?: React.ElementType }[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Tổng quan",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý tài khoản",
    icon: Users,
    children: [
      { title: "Người dùng hệ thống", path: "/users", icon: UserCheck },
      { title: "Vai trò", path: "/users/roles", icon: ShieldCheck },
      { title: "Quyền hạn", path: "/users/permissions", icon: KeyRound },
    ],
  },
  {
    title: "Quản lý tin đăng",
    icon: Building2,
    children: [
      { title: "Chờ duyệt", path: "/properties/pending", icon: Clock },
      { title: "Đã duyệt", path: "/properties/approved", icon: FileCheck2 },
      { title: "Từ chối", path: "/properties/rejected", icon: Ban },
    ],
  },
  {
    title: "Vận hành & Hỗ trợ",
    icon: Wrench,
    children: [
      { title: "Xử lý khiếu nại", path: "/operations/complaints", icon: AlertTriangle },
      { title: "Quản lý tin tức", path: "/operations/news", icon: Newspaper },
    ],
  },
  {
    title: "Blockchain Explorer",
    path: "/blockchain",
    icon: Link2,
  },
  {
    title: "Báo cáo & Phân tích",
    icon: TrendingUp,
    children: [
      { title: "Thống kê số liệu", path: "/analytics/statistics", icon: BarChart3 },
      { title: "Dự báo & AI", path: "/analytics/ai-forecast", icon: BrainCircuit },
    ],
  },
  {
    title: "Cài đặt",
    path: "/settings",
    icon: Settings,
  },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();

  // Keep track of open submenu groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Quản lý tin đăng": true,
    "Quản lý tài khoản": true,
    "Vận hành & Hỗ trợ": false,
    "Báo cáo & Phân tích": false,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isChildActive = (children?: { path: string }[]) => {
    if (!children) return false;
    return children.some((c) => location.pathname === c.path);
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 select-none ${collapsed ? "w-20" : "w-64"
        }`}
    >
      {/* 1. Brand Logo Header - Horizontal logo image only */}
      <div className="h-20 px-4 border-b border-border/80 flex items-center justify-center shrink-0">
        <Link to="/dashboard" className="flex items-center justify-center group focus:outline-none">
          {collapsed ? (
            <img
              src="/logo/homespace-logo-favicon-removebg.png"
              alt="HomeSpace Logo"
              className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <img
              src="/logo/homespace-horizontal-logo-crop-removebg.png"
              alt="HomeSpace Logo"
              className="h-10 w-auto max-w-[200px] object-contain transition-transform duration-200 group-hover:scale-105"
            />
          )}
        </Link>
      </div>

      {/* 2. Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;

          // Single menu item
          if (!item.children) {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.title}
                to={item.path || "#"}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${isActive
                  ? "bg-primary/15 text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? item.title : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          }

          // Group menu item with children
          const isOpen = openGroups[item.title];
          const hasActiveChild = isChildActive(item.children);

          return (
            <div key={item.title} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(item.title)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${hasActiveChild
                  ? "text-primary font-bold bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? item.title : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${hasActiveChild ? "text-primary" : ""
                      }`}
                  />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </div>

                {!collapsed && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                      }`}
                  />
                )}
              </button>

              {/* Submenu Items */}
              {!collapsed && isOpen && (
                <div className="pl-6 space-y-1 pt-0.5 animate-in fade-in-50 duration-150">
                  {item.children.map((sub) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${isSubActive
                          ? "text-primary font-bold bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSubActive ? "bg-primary" : "bg-muted-foreground/40"
                            }`}
                        />
                        <span className="truncate">{sub.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
