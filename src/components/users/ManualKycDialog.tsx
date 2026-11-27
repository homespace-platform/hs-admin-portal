import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setAdminUserKyc } from "@/services/admin-user.service";
import { getApiErrorMessage } from "@/utils/userUtils";
import { EMPTY_MANUAL_KYC, validateManualKyc, todayVn, type ManualKycErrors, type ManualKycForm } from "@/utils/manualKyc";

type Props = { userId: string; overwrite: boolean; onClose: () => void; onDone: () => void };

export default function ManualKycDialog({ userId, overwrite, onClose, onDone }: Props) {
  const [form, setForm] = useState<ManualKycForm>(EMPTY_MANUAL_KYC); // always empty, never preloaded
  const [errors, setErrors] = useState<ManualKycErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof ManualKycForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const found = validateManualKyc(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError("");
    try {
      await setAdminUserKyc(userId, {
        cccd: form.cccd, fullName: form.fullName.trim(), birthDate: form.birthDate, gender: form.gender as "Nam" | "Nữ",
        permanentAddress: form.permanentAddress.trim(), issueDate: form.issueDate, expirationDate: form.expirationDate, issuePlace: form.issuePlace.trim(),
      });
      toast.success("Đã xác thực KYC cho người dùng.");
      onDone();
    } catch (cause) {
      const status = (cause as { response?: { status?: number } })?.response?.status;
      setError(status === 404 ? "Không tìm thấy người dùng." : getApiErrorMessage(cause, "Không thể xác thực KYC."));
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof ManualKycForm, label: string, input: React.ReactNode) => (
    <div className="space-y-1.5">
      <label htmlFor={`kyc-${key}`} className="block text-xs font-semibold text-foreground">{label}</label>
      {input}
      {errors[key] && <p role="alert" className="text-[11px] text-destructive">{errors[key]}</p>}
    </div>
  );
  const text = (key: keyof ManualKycForm, label: string, extra: React.ComponentProps<"input"> = {}) =>
    field(key, label, <Input id={`kyc-${key}`} value={form[key]} disabled={busy} onChange={(e) => set(key, e.target.value)} className="h-10 rounded-xl bg-muted/40 text-xs sm:text-sm" {...extra} />);
  const date = (key: keyof ManualKycForm, label: string, max?: string) => text(key, label, { type: "date", max });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Xác thực KYC thủ công">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="text-base font-bold">{overwrite ? "Xác thực lại KYC (ghi đè)" : "Xác thực KYC thủ công"}</h3>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng" className="cursor-pointer rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {overwrite && <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">Người dùng đã được xác minh. Toàn bộ dữ liệu KYC hiện có sẽ bị ghi đè bằng thông tin bạn nhập bên dưới.</p>}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {text("cccd", "CCCD (12 chữ số)", { inputMode: "numeric", maxLength: 12 })}
          {text("fullName", "Họ và tên trên CCCD")}
          {date("birthDate", "Ngày sinh", todayVn())}
          {field("gender", "Giới tính",
            <select id="kyc-gender" value={form.gender} disabled={busy} onChange={(e) => set("gender", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-muted/40 px-3 text-xs sm:text-sm">
              <option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option>
            </select>)}
          {date("issueDate", "Ngày cấp", todayVn())}
          {date("expirationDate", "Ngày hết hạn")}
          {text("issuePlace", "Nơi cấp")}
        </div>
        {field("permanentAddress", "Nơi thường trú",
          <textarea id="kyc-permanentAddress" rows={2} value={form.permanentAddress} disabled={busy} onChange={(e) => set("permanentAddress", e.target.value)} className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2 text-xs sm:text-sm" />)}
        <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <p>Nhà cung cấp: <b className="text-foreground">Quản trị viên</b></p>
          <p>Độ khớp khuôn mặt: <b className="text-foreground">100%</b></p>
          <p>Kết quả kiểm tra: <b className="text-foreground">tất cả Đạt</b></p>
        </div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" disabled={busy}>{busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}{overwrite ? "Ghi đè KYC" : "Xác thực"}</Button>
        </div>
      </form>
    </div>
  );
}
