import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import {
  LayoutGrid,
  ShieldCheck,
  Building2,
  Users,
  AlertTriangle,
  Link2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default function UserDropdown() {
  const { username, fullName, avatarUrl, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const displayName = username || fullName || "Admin";
  const initialLetter = (displayName.charAt(0) || "A").toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 flex items-center gap-2 pl-1 pr-3.5 rounded-full border transition-all cursor-pointer select-none ${isOpen
          ? "border-primary/50 bg-muted shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted"
          }`}
      >
        {/* Avatar with status indicator */}
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-xs">
              {initialLetter}
            </div>
          )}
          {/* Active online green dot */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-verified border-2 border-card rounded-full" />
        </div>

        {/* Username */}
        <span className="text-xs sm:text-sm font-semibold text-foreground max-w-[120px] truncate">
          {displayName}
        </span>

        {/* Chevron Icon */}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-popover text-popover-foreground rounded-3xl shadow-2xl border border-border p-3.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto no-scrollbar select-none">
          {/* Admin Info Card */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-3.5 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  QUẢN TRỊ VIÊN
                </span>
              </div>
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Hồ sơ</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* 2. Menu Navigation Links */}
          <nav className="space-y-0.5">
            {/* Tổng quan */}
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-semibold">Bảng điều khiển</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Divider with Section Title */}
            <div className="pt-2 pb-1 px-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                TIỆN ÍCH QUẢN TRỊ
              </p>
            </div>

            {/* Quản lý tin đăng */}
            <Link
              to="/properties/pending"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-semibold">Quản lý tin đăng</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Người dùng hệ thống */}
            <Link
              to="/users/members"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-semibold">Người dùng hệ thống</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Xử lý khiếu nại */}
            <Link
              to="/operations/complaints"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-semibold">Xử lý khiếu nại</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Blockchain Explorer */}
            <Link
              to="/blockchain"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Link2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-semibold">Blockchain Explorer</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Divider */}
            <div className="h-px bg-border my-1" />

            {/* Cài đặt */}
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-semibold">Cài đặt</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Đăng xuất */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-destructive" />
                <span className="text-xs font-semibold">Đăng xuất</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-destructive/50 group-hover:text-destructive group-hover:translate-x-0.5 transition-all" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
