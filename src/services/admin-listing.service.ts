import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type {
  AdminCreateListingRequest,
  AdminListingDetailResponse,
  AdminListingQueryParams,
  AdminListingSummaryResponse,
  ChangeListingStatusRequest,
  CreateListingRequest,
  CreateListingResponse,
  ListingDetailResponse,
  ListingStatus,
} from "@/types/listing.type";

export const adminListingService = {
  /**
   * Lấy danh sách tin đăng quản trị (hỗ trợ lọc, tìm kiếm, sắp xếp, phân trang)
   */
  async findAll(
    params: AdminListingQueryParams = {}
  ): Promise<PageResponse<AdminListingSummaryResponse>> {
    const {
      page = 1,
      size = 10,
      status,
      keyword,
      ownerId,
      category,
      fromDate,
      toDate,
      sort = "submittedAt,desc",
    } = params;

    const response = await axiosClient.get<PageResponse<AdminListingSummaryResponse>>(
      "/api/v1/admin/listings",
      {
        params: {
          page,
          size,
          ...(status ? { status } : {}),
          ...(keyword && keyword.trim() ? { keyword: keyword.trim() } : {}),
          ...(ownerId ? { ownerId } : {}),
          ...(category ? { category } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
          ...(sort ? { sort } : {}),
        },
      }
    );
    return response.data;
  },

  /**
   * Lấy số lượng bài đăng theo từng trạng thái trên toàn hệ thống
   */
  async getStatusCounts(): Promise<Record<string, number>> {
    const response = await axiosClient.get<ApiResponse<Record<string, number>>>(
      "/api/v1/admin/listings/counts"
    );
    return response.data.result;
  },

  /**
   * Lấy chi tiết bài đăng và lịch sử trạng thái
   */
  async getById(listingId: string): Promise<AdminListingDetailResponse> {
    const response = await axiosClient.get<ApiResponse<AdminListingDetailResponse>>(
      `/api/v1/admin/listings/${listingId}`
    );
    return response.data.result;
  },

  /**
   * Admin tạo bài đăng mới cho người dùng
   */
  async create(request: AdminCreateListingRequest): Promise<CreateListingResponse> {
    const response = await axiosClient.post<ApiResponse<CreateListingResponse>>(
      "/api/v1/admin/listings",
      request
    );
    return response.data.result;
  },

  /**
   * Admin cập nhật thông tin bài đăng
   */
  async update(
    listingId: string,
    request: CreateListingRequest
  ): Promise<CreateListingResponse> {
    const response = await axiosClient.put<ApiResponse<CreateListingResponse>>(
      `/api/v1/admin/listings/${listingId}`,
      request
    );
    return response.data.result;
  },

  /**
   * Thay đổi trạng thái bài đăng (duyệt, từ chối, ẩn, khóa vi phạm, ...)
   */
  async changeStatus(
    listingId: string,
    status: ListingStatus,
    reason?: string | null
  ): Promise<ListingDetailResponse> {
    const payload: ChangeListingStatusRequest = {
      status,
      reason: reason && reason.trim() ? reason.trim() : null,
    };

    const response = await axiosClient.patch<ApiResponse<ListingDetailResponse>>(
      `/api/v1/admin/listings/${listingId}/status`,
      payload
    );
    return response.data.result;
  },
};

export default adminListingService;
