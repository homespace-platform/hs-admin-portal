import { useEffect, useState } from "react";
import { BadgeCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Can from "@/components/common/Can";
import { PERMISSIONS } from "@/config/permissions";
import { getAdminUserKyc } from "@/services/admin-user.service";
import { getApiErrorMessage } from "@/utils/userUtils";
import { formatVerifiedAt } from "@/utils/manualKyc";
import ManualKycDialog from "./ManualKycDialog";
import type { AdminKycStatus } from "@/types/kyc.type";

export default function UserKycPanel({ userId }: { userId: string; active?: boolean }) {
  const [kyc, setKyc] = useState<AdminKycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminUserKyc(userId)
      .then((result) => { if (!cancelled) { setKyc(result); setError(""); } })
      .catch((cause) => { if (!cancelled) setError(getApiErrorMessage(cause, "Không tải được trạng thái KYC.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, reload]);

  const verified = kyc?.verified === true;
  return (
    <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4" aria-label="Xác minh danh tính người dùng">
      <h4 className="flex items-center gap-2 text-xs font-semibold">
        <BadgeCheck className="h-4 w-4 text-primary" /> Xác minh danh tính (KYC)
      </h4>
      {loading ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Đang tải trạng thái…</p>
        : kyc ? <p className={verified ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400" : "text-xs text-muted-foreground"}>
          {verified ? ["Đã xác minh", kyc.providerLabel, formatVerifiedAt(kyc.verifiedAt)].filter(Boolean).join(" · ") : "Chưa xác minh"}
        </p> : null}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {!loading && !kyc && <Button type="button" variant="outline" size="sm" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Tải lại</Button>}
      {kyc && <Can permission={PERMISSIONS.KYC_MANAGE}>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>{verified ? "Xác thực lại KYC (ghi đè)" : "Xác thực KYC thủ công"}</Button>
      </Can>}
      {open && <ManualKycDialog userId={userId} overwrite={verified} onClose={() => setOpen(false)} onDone={() => { setOpen(false); setLoading(true); setReload((v) => v + 1); }} />}
    </section>
  );
}
