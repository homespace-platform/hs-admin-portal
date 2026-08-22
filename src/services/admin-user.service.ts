import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type { AdminUser, CreateAdminUserRequest } from "@/types/user.type";

const pendingListRequests = new Map<string, Promise<PageResponse<AdminUser>>>();

async function requestUsers(page: number, size: number): Promise<PageResponse<AdminUser>> {
  const { data } = await axiosClient.get<ApiResponse<PageResponse<AdminUser>>>(
    "/api/v1/admin/users",
    { params: { page: Math.max(page - 1, 0), size } },
  );

  return data.result;
}

export function getAdminUsers(page = 1, size = 10): Promise<PageResponse<AdminUser>> {
  const key = `${page}:${size}`;
  const pending = pendingListRequests.get(key);

  if (pending) return pending;

  const request = requestUsers(page, size).finally(() => {
    pendingListRequests.delete(key);
  });

  pendingListRequests.set(key, request);
  return request;
}

export async function getAdminUserById(userId: string): Promise<AdminUser> {
  const { data } = await axiosClient.get<ApiResponse<AdminUser>>(
    `/api/v1/admin/users/${userId}`,
  );
  return data.result;
}

export async function createAdminUser(request: CreateAdminUserRequest): Promise<AdminUser> {
  const { data } = await axiosClient.post<ApiResponse<AdminUser>>(
    "/api/v1/admin/users",
    request,
  );
  return data.result;
}

export async function setAdminUserActive(userId: string, active: boolean): Promise<void> {
  await axiosClient.patch(
    `/api/v1/admin/users/${userId}/${active ? "enable" : "disable"}`,
  );
}

export async function resendAdminUserInvitation(userId: string): Promise<void> {
  await axiosClient.post(`/api/v1/admin/users/${userId}/resend-invitation`);
}
