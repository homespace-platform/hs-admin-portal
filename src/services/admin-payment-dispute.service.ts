import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type { DisputeResolution, PaymentDisputeCase } from "@/types/payment-dispute.type";
export const adminPaymentDisputeService = {
  async list(status: string, page: number): Promise<PageResponse<PaymentDisputeCase>> {
    const response = await axiosClient.get<PageResponse<PaymentDisputeCase>>("/api/v1/admin/payment-disputes", { params: { status, page, size: 20 } });
    return response.data;
  },
  async get(id: string): Promise<PaymentDisputeCase> {
    const response = await axiosClient.get<ApiResponse<PaymentDisputeCase>>(`/api/v1/admin/payment-disputes/${id}`);
    return response.data.result;
  },
  async act(id: string, action: "CLAIM" | "DECIDE", expectedRevision: number, reason: string, resolution?: DisputeResolution): Promise<PaymentDisputeCase> {
    const response = await axiosClient.post<ApiResponse<PaymentDisputeCase>>(`/api/v1/admin/payment-disputes/${id}/actions/${action}`, { expectedRevision, reason, resolution });
    return response.data.result;
  },
};
