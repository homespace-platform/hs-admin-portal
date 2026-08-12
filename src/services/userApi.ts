import axiosClient from "@/lib/axios-client";
import type ApiResponse from "@/types/ApiResponse";
import type { UserProfileResponse } from "@/types/UserProfileResponse";

export const getUserProfileApi = async () => {
  const response = await axiosClient.get<ApiResponse<UserProfileResponse>>(
    "/api/v1/users/me/profile",
  );
  return response.data;
};
