"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, ShieldAlert, ShieldCheck, X } from "lucide-react";
import axios from "axios";
import kycService from "@/services/kyc.service";
import VnptKycCapture from "@/components/settings/sections/VnptKycCapture";
import { statusMeta } from "@/components/kyc/kycStatusMeta";
import { canCancelKyc, canStartKyc, initialKycFlowState, kycFlowReducer } from "@/lib/kyc-flow";
import { parseKycParams } from "@/lib/kyc-return";
import { fetchCurrentUser } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { KycStatusResponse } from "@/types/kyc.type";

const apiMessage = (error: unknown, fallback: string) => {
  const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
  return typeof message === "string" && message.trim() ? message : fallback;
};

/** Standalone VNPT eKYC flow (the /kyc page). Re-keyed per account so a previous admin's session never leaks. */
export default function KycFlow() {
  const userId = useAppSelector((state) => state.auth.userId);
  return <AccountKycFlow key={userId ?? "anonymous"} />;
}

function AccountKycFlow() {
  const appDispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.userId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { returnTo } = useMemo(() => parseKycParams(searchParams), [searchParams]);
  const [state, dispatch] = useReducer(kycFlowReducer, initialKycFlowState);
  const { phase } = state;

  // Every network call is driven by a phase the reducer only allows from valid states,
  // so a VERIFIED / under-review account can never reach "starting".
  useEffect(() => {
    if (phase !== "loading") return;
    let off = false;
    kycService.getStatus().then(
      (kyc) => { if (!off) dispatch({ type: "LOADED", kyc: kyc ?? { status: "NOT_VERIFIED", verifiedAt: null, provider: "VNPT", sessionId: null, sessionUrl: null } }); },
      (error) => { if (!off) dispatch({ type: "LOAD_FAILED", message: apiMessage(error, "Không tải được trạng thái KYC.") }); },
    );
    return () => { off = true; };
  }, [phase]);

  useEffect(() => {
    if (phase !== "starting") return;
    let off = false;
    kycService.createVnptSession().then(
      (session) => { if (!off) dispatch({ type: "SESSION_CREATED", session }); },
      (error) => {
        if (off) return;
        dispatch({
          type: "START_FAILED",
          message: axios.isAxiosError(error) && error.response?.data?.code === 2501
            ? "VNPT eKYC chưa được cấu hình trên hệ thống. Vui lòng liên hệ hỗ trợ."
            : apiMessage(error, "Không thể mở phiên KYC. Vui lòng thử lại sau."),
        });
      },
    );
    return () => { off = true; };
  }, [phase]);

  useEffect(() => {
    if (phase !== "cancelling") return;
    let off = false;
    kycService.cancelSession().then(
      (kyc) => { if (!off) dispatch({ type: "CANCELLED", kyc }); },
      (error) => { if (!off) dispatch({ type: "CANCEL_FAILED", message: apiMessage(error, "Không thể hủy phiên KYC.") }); },
    );
    return () => { off = true; };
  }, [phase]);

  // Stable identities: VnptKycCapture re-creates its nonce/listeners when these change.
  const onVnptResult = useCallback((kyc: KycStatusResponse) => {
    dispatch({ type: "FINALIZED", kyc });
    if (kyc.status === "VERIFIED" && userId) void appDispatch(fetchCurrentUser({ userId, force: true }));
  }, [appDispatch, userId]);
  const onFinalizing = useCallback(() => dispatch({ type: "FINALIZE_START" }), []);
  const onFinalizeFailed = useCallback(() => dispatch({ type: "FINALIZE_FAILED" }), []);
  const onCancel = useCallback(() => dispatch({ type: "CANCEL_REQUEST" }), []);
  const goBack = () => navigate(returnTo, { replace: true });

  if (state.phase === "capturing" || state.phase === "finalizing") {
    return (
      <VnptKycCapture
        variant="page"
        session={state.session}
        onResult={onVnptResult}
        onCancel={onCancel}
        onFinalizing={onFinalizing}
        onFinalizeFailed={onFinalizeFailed}
      />
    );
  }

  const busyText = state.phase === "loading" ? "Đang tải trạng thái KYC…"
    : state.phase === "starting" ? "Đang mở phiên xác minh…"
    : state.phase === "cancelling" ? "Đang hủy phiên xác minh…" : null;
  const backButton = (
    <button type="button" onClick={goBack} className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted cursor-pointer inline-flex items-center gap-1.5">
      <ArrowLeft className="w-3.5 h-3.5" />
      Quay lại
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-lg font-bold text-foreground">Xác minh danh tính (KYC)</h1>
      {busyText && (
        <div role="status" className="flex flex-wrap items-center gap-3 py-4 text-xs text-muted-foreground">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          {busyText}
          {state.phase === "loading" && backButton}
        </div>
      )}
      {state.phase === "error" && (
        <div role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3 text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{state.message}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => dispatch({ type: "RETRY" })} className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer">
              Thử lại
            </button>
            {backButton}
          </div>
        </div>
      )}
      {(state.phase === "ready" || state.phase === "result" || state.phase === "cancelled") && (() => {
        const { status } = state.kyc;
        const meta = statusMeta(status, state.kyc.rejectionReason);
        const Icon = meta.icon;
        return (
          <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 shadow-2xs ${meta.tone}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-card/80 border border-border/60 shrink-0">
                <Icon className={`w-5 h-5 ${status === "PENDING" ? "animate-spin" : ""}`} />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="text-sm font-bold text-foreground">{meta.title}</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{meta.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {canStartKyc(status) && (
                <button type="button" onClick={() => dispatch({ type: "START" })} className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 cursor-pointer inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{status === "PENDING" ? "Tiếp tục xác minh" : status === "REJECTED" || status === "EXPIRED" ? "Xác minh lại" : "Xác minh ngay"}</span>
                </button>
              )}
              {canCancelKyc(status) && (
                <button type="button" onClick={onCancel} className="h-9 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-500/15 cursor-pointer inline-flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  Hủy
                </button>
              )}
              {backButton}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
