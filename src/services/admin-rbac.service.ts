import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type {
  AdminPermission,
  AdminRole,
  UpdateAdminPermissionRequest,
  UpdateAdminRoleRequest,
} from "@/types/rbac.type";

export async function getAdminRoles(
  page = 1,
  size = 10,
  includePermissions = false,
): Promise<PageResponse<AdminRole>> {
  const { data } = await axiosClient.get<ApiResponse<PageResponse<AdminRole>>>(
    "/api/v1/admin/roles",
    { params: { page: Math.max(page - 1, 0), size, includePermissions } },
  );
  return data.result;
}

export async function getAllAdminRoles(): Promise<AdminRole[]> {
  const { data } = await axiosClient.get<ApiResponse<AdminRole[]>>("/api/v1/admin/roles/all");
  return data.result ?? [];
}

export async function getAdminRoleById(roleId: string): Promise<AdminRole> {
  const { data } = await axiosClient.get<ApiResponse<AdminRole>>(`/api/v1/admin/roles/${roleId}`);
  return data.result;
}

export async function updateAdminRole(
  roleId: string,
  request: UpdateAdminRoleRequest,
): Promise<AdminRole> {
  const { data } = await axiosClient.post<ApiResponse<AdminRole>>(
    `/api/v1/admin/roles/${roleId}`,
    request,
  );
  return data.result;
}

export async function getAdminPermissions(
  page = 1,
  size = 10,
): Promise<PageResponse<AdminPermission>> {
  const { data } = await axiosClient.get<ApiResponse<PageResponse<AdminPermission>>>(
    "/api/v1/admin/permissions",
    { params: { page: Math.max(page - 1, 0), size } },
  );
  return data.result;
}

export async function getAllAdminPermissions(): Promise<AdminPermission[]> {
  const { data } = await axiosClient.get<ApiResponse<AdminPermission[]>>(
    "/api/v1/admin/permissions/all",
  );
  return data.result ?? [];
}

export async function getAdminPermissionById(permissionId: string): Promise<AdminPermission> {
  const { data } = await axiosClient.get<ApiResponse<AdminPermission>>(
    `/api/v1/admin/permissions/${permissionId}`,
  );
  return data.result;
}

export async function updateAdminPermission(
  permissionId: string,
  request: UpdateAdminPermissionRequest,
): Promise<AdminPermission> {
  const { data } = await axiosClient.post<ApiResponse<AdminPermission>>(
    `/api/v1/admin/permissions/${permissionId}`,
    request,
  );
  return data.result;
}
