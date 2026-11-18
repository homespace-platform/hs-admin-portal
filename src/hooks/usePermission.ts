import { useAppSelector } from "@/store/hooks";
import {
  hasPermission,
  ruleForPath,
  type PermissionMode,
  type PermissionRequirement,
} from "@/config/permissions";

export { hasPermission };

export function useHasPermission(required: PermissionRequirement, mode: PermissionMode = "all"): boolean {
  const { granted, status } = useAppSelector((state) => state.permission);
  const role = useAppSelector((state) => state.user.profile?.role);
  return status === "succeeded" && role?.toUpperCase() === "ADMIN" && hasPermission(granted, required, mode);
}

export function usePermissionsStatus(): "idle" | "loading" | "succeeded" | "failed" {
  return useAppSelector((state) => state.permission.status);
}

/** Navigation check: ungated paths are open, gated paths need loaded permissions and the ADMIN role. */
export function useCanAccessPath(): (path: string) => boolean {
  const { granted, status } = useAppSelector((state) => state.permission);
  const role = useAppSelector((state) => state.user.profile?.role);
  return (path) => {
    const rule = ruleForPath(path);
    if (!rule) return true;
    return (
      status === "succeeded" &&
      role?.toUpperCase() === "ADMIN" &&
      hasPermission(granted, rule.permission, rule.mode)
    );
  };
}
