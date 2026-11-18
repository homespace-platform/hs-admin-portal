import type { ReactNode } from "react";
import { useHasPermission } from "@/hooks/usePermission";
import type { PermissionMode, PermissionRequirement } from "@/config/permissions";

interface CanProps {
  permission: PermissionRequirement;
  mode?: PermissionMode;
  fallback?: ReactNode;
  children?: ReactNode;
}

export default function Can({ permission, mode = "all", fallback = null, children }: CanProps) {
  const allowed = useHasPermission(permission, mode);
  return <>{allowed ? children : fallback}</>;
}
