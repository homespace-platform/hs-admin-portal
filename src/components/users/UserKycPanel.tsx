import { useEffect, useState } from "react";
import { BadgeCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminUserKyc } from "@/services/admin-user.service";
import { getApiErrorMessage } from "@/utils/userUtils";
import type { KycStatusResponse } from "@/types/kyc.type";

export default function UserKycPanel({ userId }: { userId: string; active?: boolean }) {
  const [kyc, setKyc] = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAdminUserKyc(userId)
      .then((result) => { if (!cancelled) { setKyc(result); setError(""); } })
      .catch((cause) => { if (!cancelled) setError(getApiErrorMessage(cause, "Không tải được trạng thái KYC.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, reload]);

  const verified = kyc?.status === "VERIFIED";
  return (
    <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4" aria-label="Xác minh danh tính người dùng">
      <h4 className="flex items-center gap-2 text-xs font-semibold">
        <BadgeCheck className="h-4 w-4 text-primary" /> Xác minh danh tính (KYC)
      </h4>
      {loading ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Đang tải trạng thái…</p>
        : verified ? <div className="space-y-1">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Đã xác minh danh tính</p>
          <p className="text-[11px] text-muted-foreground">Nguồn: {kyc.provider === "ADMIN" ? "ADMIN xác minh thủ công" : kyc.provider === "VNPT" ? "VNPT eKYC" : "Hồ sơ xác minh trước đây"}</p>
          {kyc.verifiedAt && <p className="text-[11px] text-muted-foreground">{new Date(kyc.verifiedAt).toLocaleString("vi-VN")}</p>}
        </div>
          : kyc ? <p className="text-xs text-muted-foreground">Chưa xác minh danh tính.</p> : null}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {!loading && !kyc && <Button type="button" variant="outline" size="sm" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Tải lại</Button>}
    </section>
  );
}
