import { useState, useEffect } from "react";
import {
  LogOut,
  ExternalLink,
  Home,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/common/UserAvatar";
import type { UserProfile } from "@/types/user.type";

interface AccessWarningScreenProps {
  profile: UserProfile;
  onLogout: () => void;
  initialCountdown?: number;
}

const TOTAL_COUNTDOWN = 10;
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AccessWarningScreen({
  profile,
  onLogout,
  initialCountdown = TOTAL_COUNTDOWN,
}: AccessWarningScreenProps) {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onLogout]);

  // Calculate SVG stroke offset for smooth circular progress
  const strokeDashoffset =
    CIRCUMFERENCE - (countdown / TOTAL_COUNTDOWN) * CIRCUMFERENCE;

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.username;

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Security Card */}
      <div
        role="alert"
        aria-live="polite"
        className="relative w-full max-w-xl bg-card/95 backdrop-blur-xl rounded-3xl border border-border/80 p-6 sm:p-9 text-center shadow-2xl space-y-6 animate-in fade-in-50 zoom-in-95 duration-200"
      >
        {/* Brand Logo & Security Protocol Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <img
            src="/logo/homespace-horizontal-logo-crop-removebg.png"
            alt="HomeSpace Logo"
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border text-[11px] font-mono text-muted-foreground">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>RBAC Protocol 2.0</span>
          </div>
        </div>

        {/* Circular Countdown & Status Badge */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="relative flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="w-24 h-24 transform -rotate-90" aria-hidden="true">
              <circle
                cx="48"
                cy="48"
                r={RADIUS}
                className="text-muted/40 stroke-current"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={RADIUS}
                className="text-amber-500 stroke-current transition-all duration-1000 ease-linear"
                strokeWidth="5"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Icon inside Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black font-mono text-foreground leading-none">
                {countdown}s
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">
                Tự ngắt
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Bạn không có quyền truy cập tài nguyên này
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Khu vực này được bảo vệ nghiêm ngặt và chỉ cho phép tài khoản có vai trò{" "}
              <strong className="text-primary font-bold">ADMIN</strong> truy cập.
            </p>
          </div>
        </div>

        {/* User Identity & Role Contrast Card */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              src={profile.avatarUrl}
              name={fullName}
              sizeClassName="w-11 h-11 text-base shadow-xs"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                @{profile.username}
              </p>
            </div>
          </div>

          {/* Role Comparison */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              Vai trò hiện tại
            </span>
            <Badge variant="warning" className="text-xs font-bold font-mono">
              {profile.role || "USER"}
            </Badge>
          </div>
        </div>

        {/* Guidance Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs">
          <div className="p-3 rounded-xl bg-card border border-border/80 flex items-start gap-2.5">
            <Home className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Dành cho Khách hàng</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Tìm kiếm căn hộ, quản lý tin đăng & hợp đồng thuê.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Dành cho Ban Quản Trị</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Vui lòng đăng nhập tài khoản Quản trị viên được cấp phép.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            asChild
            variant="default"
            size="lg"
            className="w-full sm:flex-1 h-11 rounded-2xl text-xs font-bold gap-2 shadow-md shadow-primary/20 cursor-pointer"
          >
            <a href="http://localhost:3000">
              <Home className="w-4 h-4" />
              <span>Về trang chủ Khách hàng</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onLogout}
            className="w-full sm:w-auto h-11 px-5 rounded-2xl border-border hover:bg-muted text-destructive text-xs font-bold gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất ngay ({countdown}s)</span>
          </Button>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-muted-foreground font-medium">
        © 2026 HomeSpace Platform • Bảo mật phân quyền RBAC
      </footer>
    </div>
  );
}
