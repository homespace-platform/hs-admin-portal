import axiosClient from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api.type";

export interface MyPermissions {
  email: string;
  role: string;
  permissions: string[];
}

const permissionService = {
  async getMine(): Promise<MyPermissions> {
    const response = await axiosClient.get<ApiResponse<MyPermissions>>("/api/v1/users/me/permissions");
    return response.data.result;
  },
};

export default permissionService;
