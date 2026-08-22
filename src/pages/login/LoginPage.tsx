import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";

export default function LoginPage() {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  useEffect(() => {
    if (authenticated) {
      navigate(from, { replace: true });
    }
  }, [authenticated, navigate, from]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-2xl text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2 shadow-2xs">
            <img
              src="/logo/homespace-logo-favicon-removebg.png"
              alt="HomeSpace Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold font-heading text-foreground tracking-tight">
            EstateAdmin Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Hệ thống quản trị và kiểm duyệt nền tảng HomeSpace
          </p>
        </div>

        {/* Security Badge */}
        <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/80 text-xs text-muted-foreground flex items-center gap-2.5 text-left">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <span>
            Khu vực dành riêng cho Ban quản trị. Đăng nhập bảo mật qua Keycloak SSO.
          </span>
        </div>

        {/* Login Action Button */}
        <button
          type="button"
          onClick={login}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-md shadow-primary/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập với Keycloak</span>
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        © 2026 HomeSpace. All rights reserved.
      </div>
    </div>
  );
}
