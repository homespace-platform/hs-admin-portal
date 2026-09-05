import axiosClient from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api.type";
import type {
  ContractDocumentResponse,
  ContractResponse,
  ContractRevisionResponse,
  ContractTemplateResponse,
  ContractTemplateStatus,
  ContractTemplateVersionResponse,
  CreateContractTemplateRequest,
  CreateTemplateVersionRequest,
  TemplateFieldDefinition,
  UpdateContractTemplateRequest,
} from "@/types/contract.type";

export const adminContractService = {
  /**
   * Lấy danh mục mã trường (placeholder catalog) được hệ thống hỗ trợ
   */
  async getCatalogFields(): Promise<TemplateFieldDefinition[]> {
    const response = await axiosClient.get<ApiResponse<TemplateFieldDefinition[]>>(
      "/api/v1/admin/contract-template-fields"
    );
    return response.data.result;
  },

  /**
   * Lấy danh sách mẫu hợp đồng
   */
  async listTemplates(params?: {
    status?: ContractTemplateStatus;
    category?: string;
    rentalMode?: string;
  }): Promise<ContractTemplateResponse[]> {
    const response = await axiosClient.get<ApiResponse<ContractTemplateResponse[]>>(
      "/api/v1/admin/contract-templates",
      { params }
    );
    return response.data.result;
  },

  /**
   * Tạo mới mẫu hợp đồng kèm phiên bản Word đầu tiên
   */
  async createTemplate(
    request: CreateContractTemplateRequest
  ): Promise<ContractTemplateResponse> {
    const response = await axiosClient.post<ApiResponse<ContractTemplateResponse>>(
      "/api/v1/admin/contract-templates",
      request
    );
    return response.data.result;
  },

  /**
   * Chi tiết mẫu hợp đồng
   */
  async getTemplate(templateId: string): Promise<ContractTemplateResponse> {
    const response = await axiosClient.get<ApiResponse<ContractTemplateResponse>>(
      `/api/v1/admin/contract-templates/${templateId}`
    );
    return response.data.result;
  },

  /**
   * Cập nhật thông tin hiển thị của mẫu hợp đồng
   */
  async updateTemplate(
    templateId: string,
    request: UpdateContractTemplateRequest
  ): Promise<ContractTemplateResponse> {
    const response = await axiosClient.patch<ApiResponse<ContractTemplateResponse>>(
      `/api/v1/admin/contract-templates/${templateId}`,
      request
    );
    return response.data.result;
  },

  /**
   * Thêm phiên bản Word mới cho mẫu
   */
  async createVersion(
    templateId: string,
    request: CreateTemplateVersionRequest
  ): Promise<ContractTemplateVersionResponse> {
    const response = await axiosClient.post<ApiResponse<ContractTemplateVersionResponse>>(
      `/api/v1/admin/contract-templates/${templateId}/versions`,
      request
    );
    return response.data.result;
  },

  /**
   * Lấy danh sách các phiên bản của mẫu
   */
  async getVersions(
    templateId: string
  ): Promise<ContractTemplateVersionResponse[]> {
    const response = await axiosClient.get<ApiResponse<ContractTemplateVersionResponse[]>>(
      `/api/v1/admin/contract-templates/${templateId}/versions`
    );
    return response.data.result;
  },

  /**
   * Chi tiết một phiên bản mẫu
   */
  async getVersion(
    templateId: string,
    versionId: string
  ): Promise<ContractTemplateVersionResponse> {
    const response = await axiosClient.get<ApiResponse<ContractTemplateVersionResponse>>(
      `/api/v1/admin/contract-templates/${templateId}/versions/${versionId}`
    );
    return response.data.result;
  },

  /**
   * Xuất bản phiên bản Word (để chủ nhà có thể chọn)
   */
  async publishVersion(
    templateId: string,
    versionId: string
  ): Promise<ContractTemplateVersionResponse> {
    const response = await axiosClient.post<ApiResponse<ContractTemplateVersionResponse>>(
      `/api/v1/admin/contract-templates/${templateId}/versions/${versionId}/publish`
    );
    return response.data.result;
  },

  /**
   * Xem thử (Test Preview) mẫu Word với Dummy Data (nhận về Blob để hiển thị hoặc tải về)
   */
  async testPreviewVersion(
    templateId: string,
    versionId: string
  ): Promise<{ blob: Blob; filename: string; contentType: string }> {
    const response = await axiosClient.post(
      `/api/v1/admin/contract-templates/${templateId}/versions/${versionId}/test-preview`,
      {},
      { responseType: "blob" }
    );

    const contentType = String(response.headers["content-type"] || "application/octet-stream");
    const isPdf = contentType.includes("application/pdf");
    const filename = isPdf ? "test_preview.pdf" : "test_preview.docx";

    return {
      blob: new Blob([response.data], { type: contentType }),
      filename,
      contentType,
    };
  },

  /**
   * Lưu trữ (ngừng áp dụng) mẫu hợp đồng
   */
  async archiveTemplate(templateId: string): Promise<void> {
    await axiosClient.post(
      `/api/v1/admin/contract-templates/${templateId}/archive`
    );
  },

  /**
   * Lấy danh sách hợp đồng trên toàn hệ thống
   */
  async listContracts(status?: string, keyword?: string): Promise<ContractResponse[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (keyword) params.keyword = keyword;

    const response = await axiosClient.get<ApiResponse<ContractResponse[]>>(
      "/api/v1/admin/contracts",
      { params }
    );
    return response.data.result;
  },

  /**
   * Chi tiết hợp đồng
   */
  async getContract(contractId: string): Promise<ContractResponse> {
    const response = await axiosClient.get<ApiResponse<ContractResponse>>(
      `/api/v1/admin/contracts/${contractId}`
    );
    return response.data.result;
  },

  /**
   * Xem snapshot revision của hợp đồng
   */
  async getContractRevision(contractId: string): Promise<ContractRevisionResponse> {
    const response = await axiosClient.get<ApiResponse<ContractRevisionResponse>>(
      `/api/v1/admin/contracts/${contractId}/revision`
    );
    return response.data.result;
  },

  /**
   * Danh sách tài liệu của hợp đồng
   */
  async getContractDocuments(contractId: string): Promise<ContractDocumentResponse[]> {
    const response = await axiosClient.get<ApiResponse<ContractDocumentResponse[]>>(
      `/api/v1/admin/contracts/${contractId}/documents`
    );
    return response.data.result;
  },
};
