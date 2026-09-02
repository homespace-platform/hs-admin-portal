import axiosClient from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api.type";
import type {
  CreateStorageUploadRequest,
  CreateStorageUploadResponse,
} from "@/types/storage.type";

const storageService = {
  async uploadUserAvatar(file: File, userId: string): Promise<string> {
    return upload(file, {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      purpose: "USER_AVATAR",
      visibility: "PUBLIC",
      referenceType: "USER",
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
