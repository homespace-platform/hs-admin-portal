import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type {
  NewsQueryParams,
  NewsResponse,
  NewsSummary,
  NewsUpsertRequest,
} from "@/types/news.type";

const BASE_URL = "/api/v1/admin/news";

const adminNewsService = {
  async findAll(
    params: NewsQueryParams = {},
  ): Promise<PageResponse<NewsSummary>> {
    const response = await axiosClient.get<PageResponse<NewsSummary>>(
      BASE_URL,
      {
        params: {
          page: params.page ?? 1,
          size: params.size ?? 10,
          sort: params.sort ?? "createdAt,desc",
          ...(params.status ? { status: params.status } : {}),
          ...(params.category ? { category: params.category } : {}),
          ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
        },
      },
    );
    return response.data;
  },

  async getById(newsId: string): Promise<NewsResponse> {
    const response = await axiosClient.get<ApiResponse<NewsResponse>>(
      `${BASE_URL}/${newsId}`,
    );
    return response.data.result;
  },

  async create(request: NewsUpsertRequest): Promise<NewsResponse> {
    const response = await axiosClient.post<ApiResponse<NewsResponse>>(
      BASE_URL,
      request,
    );
    return response.data.result;
  },

  async update(
    newsId: string,
    request: NewsUpsertRequest,
  ): Promise<NewsResponse> {
    const response = await axiosClient.put<ApiResponse<NewsResponse>>(
      `${BASE_URL}/${newsId}`,
      request,
    );
    return response.data.result;
  },

  async delete(newsId: string): Promise<void> {
    await axiosClient.delete(`${BASE_URL}/${newsId}`);
  },
};

export default adminNewsService;
