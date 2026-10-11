import axiosClient from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api.type";
import type {
  KnowledgeDocumentDetail,
  KnowledgeJob,
  KnowledgeList,
  KnowledgeSearchResult,
  KnowledgeUploadResult,
  TestAskResult,
  WorkerHealthResult,
  KnowledgeContent,
  KnowledgeBatchItem,
} from "@/types/knowledge.type";


const base = "/api/v1/admin/ai/knowledge";

type JobEnqueueResult = { job_id: string; status: string };

export const adminKnowledgeService = {
  async list(offset = 0, limit = 20): Promise<KnowledgeList> {
    const response = await axiosClient.get<ApiResponse<KnowledgeList>>(`${base}/documents`, {
      timeout: 15000,
      params: { offset, limit },
    });
    return response.data.result;
  },

  async detail(documentId: string): Promise<KnowledgeDocumentDetail> {
    const response = await axiosClient.get<ApiResponse<KnowledgeDocumentDetail>>(
      `${base}/documents/${encodeURIComponent(documentId)}`,
      { timeout: 15000 },
    );
    return response.data.result;
  },

  async upload(file: File): Promise<KnowledgeUploadResult> {
    const form = new FormData();
    form.append("file", file);
    const response = await axiosClient.post<ApiResponse<KnowledgeUploadResult>>(
      `${base}/documents`,
      form,
    );
    return response.data.result;
  },

  async uploadBatch(files: File[], onProgress: (percent: number) => void): Promise<KnowledgeBatchItem[]> {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const response = await axiosClient.post<ApiResponse<{ items: KnowledgeBatchItem[] }>>(
      `${base}/documents/batch`, form,
      { timeout: 60000, onUploadProgress: (event) => onProgress(event.total ? Math.round(event.loaded * 100 / event.total) : 0) },
    );
    return response.data.result.items;
  },

  async content(documentId: string): Promise<KnowledgeContent> {
    const response = await axiosClient.get<ApiResponse<KnowledgeContent>>(
      `${base}/documents/${encodeURIComponent(documentId)}/content`,
      { timeout: 15000 },
    );
    return response.data.result;
  },

  async updateContent(documentId: string, markdown: string, expectedVersionId: string): Promise<KnowledgeUploadResult> {
    const response = await axiosClient.put<ApiResponse<KnowledgeUploadResult>>(
      `${base}/documents/${encodeURIComponent(documentId)}/content`,
      { markdown, expectedVersionId },
      { timeout: 30000 },
    );
    return response.data.result;
  },

  async updateDraftMetadata(
    documentId: string,
    metadata: {
      title: string;
      category: string;
      visibility: "public" | "admin";
      audience: string[];
    },
  ): Promise<void> {
    await axiosClient.patch(
      `${base}/documents/${encodeURIComponent(documentId)}`,
      metadata,
    );
  },

  async approve(documentId: string): Promise<void> {
    await axiosClient.post(`${base}/documents/${encodeURIComponent(documentId)}/approve`);
  },

  async publish(documentId: string): Promise<string> {
    const response = await axiosClient.post<ApiResponse<JobEnqueueResult>>(
      `${base}/documents/${encodeURIComponent(documentId)}/publish`,
    );
    return response.data.result.job_id;
  },

  async reindex(documentId: string): Promise<string> {
    const response = await axiosClient.post<ApiResponse<JobEnqueueResult>>(
      `${base}/documents/${encodeURIComponent(documentId)}/reindex`,
    );
    return response.data.result.job_id;
  },

  async archive(documentId: string): Promise<void> {
    await axiosClient.post(`${base}/documents/${encodeURIComponent(documentId)}/archive`);
  },

  async job(jobId: string): Promise<KnowledgeJob> {
    const response = await axiosClient.get<ApiResponse<KnowledgeJob>>(
      `${base}/jobs/${encodeURIComponent(jobId)}`,
      { timeout: 15000 },
    );
    return response.data.result;
  },

  async search(query: string, scope: "public" | "admin"): Promise<KnowledgeSearchResult> {
    const response = await axiosClient.post<ApiResponse<KnowledgeSearchResult>>(
      `${base}/search`,
      { query, scope, topK: 5 },
    );
    return response.data.result;
  },

  async workerHealth(): Promise<WorkerHealthResult> {
    const response = await axiosClient.get<ApiResponse<WorkerHealthResult>>(
      `${base}/worker-health`,
      { timeout: 15000 },
    );
    return response.data.result;
  },

  async testAsk(query: string, scope: "public" | "admin"): Promise<TestAskResult> {
    const response = await axiosClient.post<ApiResponse<TestAskResult>>(
      `${base}/test-ask`,
      { query, scope },
    );
    return response.data.result;
  },
};

