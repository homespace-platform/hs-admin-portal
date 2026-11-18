import type { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { Home, Loader2, ShieldX } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPermissions } from "@/features/permission/permissionSlice";
import { useHasPermission, usePermissionsStatus } from "@/hooks/usePermission";
import type { PermissionMode, PermissionRequirement } from "@/config/permissions";

interface RequirePermissionProps {
  permission: PermissionRequirement;
  mode?: PermissionMode;
  children?: ReactNode;
}

const box = "min-h-[60vh] flex flex-col items-center justify-center text-center p-6 select-none";
const button =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm shadow-primary/25";

export default function RequirePermission({ permission, mode = "all", children }: RequirePermissionProps) {
  const dispatch = useAppDispatch();
  const status = usePermissionsStatus();
  const error = useAppSelector((state) => state.permission.error);
  const allowed = useHasPermission(permission, mode);

  if (allowed) return <>{children ?? <Outlet />}</>;

  if (status === "idle" || status === "loading") {
    return (
      <div className={box} role="status">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={box} role="alert">
        <div className="max-w-md w-full space-y-4">
          <h2 className="text-xl font-bold font-heading text-foreground">Không thể tải quyền hạn</h2>
          <p className="text-xs text-muted-foreground">{error ?? "Vui lòng thử lại."}</p>
          <button type="button" className={button} onClick={() => void dispatch(fetchPermissions())}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={box}>
      <div className="max-w-md w-full space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
          <ShieldX className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold font-heading text-foreground">Không có quyền truy cập</h2>
        <p className="text-xs text-muted-foreground">
          Tài khoản của bạn chưa được cấp quyền để xem trang này. Liên hệ quản trị viên cấp cao để được hỗ trợ.
        </p>
        <Link to="/dashboard" className={button}>
          <Home className="w-4 h-4" />
          <span>Về Bảng điều khiển</span>
        </Link>
      </div>
    </div>
  );
}
