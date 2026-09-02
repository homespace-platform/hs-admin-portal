import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type {
  CreateStorageUploadRequest,
  CreateStorageUploadResponse,
  StorageObjectResponse,
  StorageUrlResponse,
} from "@/types/storage.type";

const USER_AVATAR_REFERENCE_TYPE = "USER";
const USER_AVATAR_PURPOSE = "USER_AVATAR";
const READY_STATUS = "READY";

const storageService = {
  async uploadUserAvatar(file: File, userId: string): Promise<string> {
    return upload(file, {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      purpose: USER_AVATAR_PURPOSE,
      visibility: "PUBLIC",
      referenceType: USER_AVATAR_REFERENCE_TYPE,
      referenceId: userId,
    });
  },

  async uploadNewsImage(file: File): Promise<string> {
    return upload(file, {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      purpose: "NEWS_IMAGE",
      visibility: "PUBLIC",
      referenceType: "NEWS",
      referenceId: "",
    });
  },

  async listUserAvatars(
    userId: string,
    page = 1,
    size = 20,
  ): Promise<StorageObjectResponse[]> {
    const response = await axiosClient.get<PageResponse<StorageObjectResponse>>(
      "/api/v1/storage",
      {
        params: {
          referenceType: USER_AVATAR_REFERENCE_TYPE,
          referenceId: userId,
          purpose: USER_AVATAR_PURPOSE,
          status: READY_STATUS,
          page,
          size,
        },
      },
    );
    return response.data.result;
  },

  async getViewUrl(storageId: string): Promise<string> {
    const response = await axiosClient.get<ApiResponse<StorageUrlResponse>>(
      `/api/v1/storage/${storageId}/view-url`,
    );
    return response.data.result.url;
  },
};

async function upload(
  file: File,
  request: CreateStorageUploadRequest,
): Promise<string> {
  const { data } = await axiosClient.post<
    ApiResponse<CreateStorageUploadResponse>
  >("/api/v1/storage/uploads", request);
  const { storageId, uploadUrl } = data.result;

  const s3Response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!s3Response.ok)
    throw new Error(`Không thể tải ảnh lên S3 (${s3Response.status}).`);

  await axiosClient.post<ApiResponse<unknown>>(
    `/api/v1/storage/${storageId}/complete`,
    {},
  );
  return storageId;
}

export default storageService;
