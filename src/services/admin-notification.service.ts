import axiosClient from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api.type";

export type BroadcastPriority = "NORMAL" | "HIGH" | "URGENT";

export interface BroadcastRequest {
  broadcastId: string;
  title: string;
  body: string;
  priority: BroadcastPriority;
}

export interface BroadcastResult {
  broadcastId: string;
  status: "QUEUED";
}

export async function broadcastNotification(
  request: BroadcastRequest,
): Promise<BroadcastResult> {
  const response = await axiosClient.post<ApiResponse<BroadcastResult>>(
    "/api/v1/notifications/admin/broadcast",
    request,
  );
  return response.data.result;
}
