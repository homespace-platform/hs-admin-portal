// Pure state machine for the standalone /kyc page (no React, no I/O).
import type { KycStatus, KycStatusResponse, VnptKycSession } from "@/types/kyc.type";

export type KycPhase = "loading" | "ready" | "starting" | "capturing" | "finalizing" | "cancelling" | "result" | "cancelled" | "error";

export type KycFlowState =
  | { phase: "loading" }
  | { phase: "ready" | "starting" | "cancelling" | "result" | "cancelled"; kyc: KycStatusResponse }
  | { phase: "capturing" | "finalizing"; kyc: KycStatusResponse; session: VnptKycSession }
  /** `retry` says what the retry button repeats; every error screen also has a way back. */
  | { phase: "error"; message: string; kyc: KycStatusResponse | null; retry: "load" | "start" };

export type KycFlowEvent =
  | { type: "LOADED"; kyc: KycStatusResponse }
  | { type: "LOAD_FAILED"; message: string }
  | { type: "START" }
  | { type: "SESSION_CREATED"; session: VnptKycSession }
  | { type: "START_FAILED"; message: string }
  | { type: "FINALIZE_START" }
  | { type: "FINALIZE_FAILED" }
  | { type: "FINALIZED"; kyc: KycStatusResponse }
  | { type: "CANCEL_REQUEST" }
  | { type: "CANCELLED"; kyc: KycStatusResponse }
  | { type: "CANCEL_FAILED"; message: string }
  | { type: "RETRY" };

export const initialKycFlowState: KycFlowState = { phase: "loading" };

/** Same rules as the old Settings card. VERIFIED and REVIEW_REQUIRED can never start a new session. */
export const canStartKyc = (status: KycStatus) =>
  status === "NOT_VERIFIED" || status === "PENDING" || status === "REJECTED" || status === "EXPIRED";
export const canCancelKyc = (status: KycStatus) => status === "PENDING" || status === "REVIEW_REQUIRED";

/** Which screen a backend status maps to: final outcomes -> result, otherwise the start screen. */
export function phaseForStatus(status: KycStatus): "ready" | "result" {
  return status === "NOT_VERIFIED" || status === "PENDING" ? "ready" : "result";
}

export function kycFlowReducer(state: KycFlowState, event: KycFlowEvent): KycFlowState {
  switch (event.type) {
    case "LOADED":
      return state.phase === "loading" ? { phase: phaseForStatus(event.kyc.status), kyc: event.kyc } : state;
    case "LOAD_FAILED":
      return state.phase === "loading" ? { phase: "error", message: event.message, kyc: null, retry: "load" } : state;
    case "START":
      return (state.phase === "ready" || state.phase === "result" || state.phase === "cancelled") && canStartKyc(state.kyc.status)
        ? { phase: "starting", kyc: state.kyc }
        : state;
    case "SESSION_CREATED":
      return state.phase === "starting"
        ? {
            phase: "capturing",
            session: event.session,
            kyc: { status: "PENDING", verifiedAt: null, provider: "VNPT", sessionId: event.session.sessionId, sessionUrl: null, rejectionReason: null },
          }
        : state;
    case "START_FAILED":
      return state.phase === "starting" ? { phase: "error", message: event.message, kyc: state.kyc, retry: "start" } : state;
    case "FINALIZE_START":
      return state.phase === "capturing" ? { ...state, phase: "finalizing" } : state;
    case "FINALIZE_FAILED":
      return state.phase === "finalizing" ? { ...state, phase: "capturing" } : state;
    case "FINALIZED":
      return state.phase === "capturing" || state.phase === "finalizing" ? { phase: phaseForStatus(event.kyc.status), kyc: event.kyc } : state;
    case "CANCEL_REQUEST":
      return (state.phase === "capturing" || state.phase === "ready" || state.phase === "result" || state.phase === "cancelled") && canCancelKyc(state.kyc.status)
        ? { phase: "cancelling", kyc: state.kyc }
        : state;
    case "CANCELLED":
      return state.phase === "cancelling" ? { phase: "cancelled", kyc: event.kyc } : state;
    case "CANCEL_FAILED":
      return state.phase === "cancelling" ? { phase: "error", message: event.message, kyc: state.kyc, retry: "load" } : state;
    case "RETRY":
      if (state.phase !== "error") return state;
      if (state.retry === "load") return { phase: "loading" };
      return state.kyc && canStartKyc(state.kyc.status) ? { phase: "starting", kyc: state.kyc } : { phase: "loading" };
  }
}
