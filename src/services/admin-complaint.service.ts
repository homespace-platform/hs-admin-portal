import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type { ComplaintAction, ComplaintCase, ComplaintWorkflowSource } from "@/types/complaint.type";
export const adminComplaintService = {
  async sourcePdf(source: NonNullable<ComplaintWorkflowSource["documents"]>[number]): Promise<Blob> {
    if (source.purpose !== "SIGNED_FINAL" || !source.signingContractId || !source.storageObjectId) {
      throw new Error("Thiếu định danh PDF căn cứ đã ký; vui lòng tải lại hồ sơ.");
    }
    const metadata = await axiosClient.get<ApiResponse<{id:string;contractId:string;storageObjectId?:string;purpose:string;documentType:string;status:string}[]>>(
      "/api/v1/admin/contracts/" + encodeURIComponent(source.signingContractId) + "/documents",
    );
    const matches = (metadata.data.result ?? []).filter(row => row.contractId === source.signingContractId
      && row.storageObjectId === source.storageObjectId && row.purpose === source.purpose
      && row.documentType === "PDF" && row.status === "READY");
    if (matches.length !== 1 || !matches[0].id) {
      throw new Error("Không tìm thấy đúng PDF căn cứ đã lưu. Không tự thay bằng bản mới nhất.");
    }
    try {
      const response = await axiosClient.post<Blob>(
        "/api/v1/contracts/documents/" + encodeURIComponent(matches[0].id) + "/content",
        null, { responseType: "blob" },
      );
      return new Blob([response.data], {type:"application/pdf"});
    } catch (error) {
      const body = (error as {response?:{data?:unknown}}).response?.data;
      if (body instanceof Blob) {
        const details = await body.text();
        let message: unknown;
        try { message = JSON.parse(details).message; } catch { /* Preserve the safe fallback below. */ }
        if (typeof message === "string") throw new Error(message, {cause:error});
      }
      throw new Error("Chưa xác thực được PDF căn cứ; hãy thử lại. Không mở bằng đường dẫn chưa kiểm tra.", {cause:error});
    }
  },

  async list(params:{status?:string;category?:string;overdue?:boolean;page:number}) {
    return (await axiosClient.get<PageResponse<ComplaintCase>>("/api/v1/admin/complaints",{params:{...params,size:20}})).data;
  },
  async get(id:string){return (await axiosClient.get<ApiResponse<ComplaintCase>>("/api/v1/admin/complaints/"+encodeURIComponent(id))).data.result;},
  async act(id:string,action:string,payload:ComplaintAction){return (await axiosClient.post<ApiResponse<ComplaintCase>>("/api/v1/admin/complaints/"+encodeURIComponent(id)+"/actions/"+action,payload)).data.result;},
};
