export type DisputeResolution = "REVIEW_TRANSFER" | "REOPEN_TRANSFER";
export interface PaymentDisputeCase {
  id: string; paymentId: string; rentalRequestId?: string; contractId?: string;
  payerId: string; payeeId: string; openedBy: string; reason: string; openedAt: string;
  status: "OPEN" | "ESCALATED" | "RESOLVED"; previousPaymentStatus?: string; paymentStatus: string;
  paymentType: string; direction: string; amount: number; currency: string; revision: number;
  proposedBy?: string; proposedResolution?: DisputeResolution; proposalReason?: string; assignedTo?: string;
  resolvedBy?: string; resolution?: DisputeResolution; resolutionReason?: string; resolvedAt?: string;
  allowedActions: string[];
  events: { revision: number; action: string; actorId: string; actorRole: string; reason: string; evidenceStorageId?: string; metadataJson?: string; occurredAt: string }[];
  evidences: { storageId: string; uploadedBy: string; note?: string; createdAt?: string }[];
}
export const resolutionLabels: Record<DisputeResolution,string> = {
  REVIEW_TRANSFER: "Kiểm tra chứng từ để bên nhận xác nhận tiền",
  REOPEN_TRANSFER: "Mở lại bước gửi chứng từ / báo chuyển tiền",
};
export function eventResolution(metadata?: string): string | undefined {
  try {
    const value: unknown = JSON.parse(metadata ?? "{}").resolution;
    return value === "REVIEW_TRANSFER" || value === "REOPEN_TRANSFER" ? resolutionLabels[value] : undefined;
  } catch { return undefined; }
}
