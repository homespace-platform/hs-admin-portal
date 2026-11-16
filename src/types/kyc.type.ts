export type KycStatus =
  | "NOT_VERIFIED"
  | "PENDING"
  | "REVIEW_REQUIRED"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export type KycProvider = "DIDIT" | "VNPT";

export type KycStatusResponse = {
  status: KycStatus;
  verifiedAt: string | null;
  provider: KycProvider;
  sessionId: string | null;
  sessionUrl: string | null;
  rejectionReason?: string | null;
};
