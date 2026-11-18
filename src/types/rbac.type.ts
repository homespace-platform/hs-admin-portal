import type { UserAuditActor } from "@/types/user.type";

export type AdminPermission = {
  id: string;
  name: string;
  description?: string | null;
  /** Computed by the backend; fall back to permissionScope() when absent. */
  scope?: "ADMIN" | "USER" | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: UserAuditActor | string | null;
  updatedBy?: UserAuditActor | string | null;
};

export type AdminRole = {
  id: string;
  name: string;
  description?: string | null;
  permissions?: AdminPermission[] | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: UserAuditActor | string | null;
  updatedBy?: UserAuditActor | string | null;
};

export type UpdateAdminRoleRequest = {
  description?: string | null;
  permissionIdList?: string[] | null;
};

export type UpdateAdminPermissionRequest = {
  description?: string | null;
};
