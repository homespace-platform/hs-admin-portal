import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { adminPaymentDisputeService as service } from "@/services/admin-payment-dispute.service";
import storageService from "@/services/storage.service";
import { eventResolution, resolutionLabels, type DisputeResolution, type PaymentDisputeCase } from "@/types/payment-dispute.type";
import { getApiErrorMessage } from "@/utils/apiError";
import { useAuth } from "@/features/auth/useAuth";

const date = (value?: string) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
const statusLabels = { OPEN: "Hai bên đối soát", ESCALATED: "Chuyển quản trị viên", RESOLVED: "Đã mở hướng xử lý" };
const actionLabels: Record<string,string> = { OPENED:"Mở đối soát", LEGACY_ADOPTED:"Tiếp nhận khoản đối soát cũ", COMMENT:"Phản hồi / chứng cứ", PROPOSE:"Đề xuất", ACCEPT:"Đồng ý", DECLINE:"Chưa đồng ý", ESCALATE:"Chuyển quản trị viên", CLAIM:"Tiếp nhận xử lý", DECIDE:"Quyết định hướng xử lý" };
const button = "rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50";

export default function ComplaintsPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<PaymentDisputeCase[]>([]), [current, setCurrent] = useState<PaymentDisputeCase | null>(null);
  const [status, setStatus] = useState("ESCALATED"), [page, setPage] = useState(1), [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(""), [resolution, setResolution] = useState<DisputeResolution>("REVIEW_TRANSFER");
  const listGeneration = useRef(0), detailGeneration = useRef(0), mutex = useRef(false);
  const refresh = useCallback(() => {
    const token = ++listGeneration.current;
    return service.list(status, page).then(result => {
      if (token === listGeneration.current) { setRows(result.result); setHasMore(result.hasMore); setError(""); }
    }).catch(cause => {
      if (token === listGeneration.current) setError(getApiErrorMessage(cause, "Chưa tải được danh sách đối soát."));
    }).finally(() => { if (token === listGeneration.current) setLoading(false); });
  }, [status, page]);
  useEffect(() => {
    const scope = listGeneration; void refresh();
    return () => { scope.current++; };
  }, [refresh]);
  useEffect(() => { const scope = detailGeneration; return () => { scope.current++; }; }, []);
  async function open(id: string) {
    const token = ++detailGeneration.current; setCurrent(null); setReason("");
    try { const detail = await service.get(id); if (token === detailGeneration.current) setCurrent(detail); }
    catch (cause) { if (token === detailGeneration.current) toast.error(getApiErrorMessage(cause, "Chưa tải được hồ sơ.")); }
  }
  async function act(action: "CLAIM" | "DECIDE") {
    if (!current || mutex.current || reason.trim().length < 10) return;
    const reviewed = current, token = detailGeneration.current;
    mutex.current = true; setBusy(true);
    try {
      const updated = await service.act(reviewed.id, action, reviewed.revision, reason.trim(), action === "DECIDE" ? resolution : undefined);
      if (token === detailGeneration.current) { setCurrent(updated); setReason(""); }
      await refresh(); toast.success("Đã cập nhật hướng xử lý đối soát.");
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Chưa thể xử lý hồ sơ."));
      // A stale decision must be reviewed again; do not retry it automatically.
      if (token === detailGeneration.current) {
        try { const updated = await service.get(reviewed.id); if (token === detailGeneration.current) setCurrent(updated); }
        catch { /* Keep the original error and reviewed history visible. */ }
      }
    } finally { mutex.current = false; setBusy(false); }
  }
  async function proof(id: string) {
    const tab = window.open("", "_blank");
    try { const url = await storageService.getViewUrl(id); if (tab) { tab.opener = null; tab.location.href = url; } }
    catch (cause) { tab?.close(); toast.error(getApiErrorMessage(cause, "Không mở được chứng cứ.")); }
  }
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Đối soát thanh toán</h1><p className="mt-1 text-sm text-muted-foreground">Xem ý kiến và chứng cứ hai bên, tiếp nhận các khoản đã chuyển cấp để mở hướng xử lý phù hợp.</p></div>
    <div className="flex flex-wrap items-center gap-3"><label>Trạng thái <select aria-label="Lọc trạng thái đối soát" value={status} onChange={e => { setLoading(true); setStatus(e.target.value); setPage(1); }} className="ml-2 rounded-lg border p-2">{Object.entries(statusLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="button" className={button} onClick={() => { setLoading(true); void refresh(); }}>Làm mới</button></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p>Đang tải hồ sơ…</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Mở lúc</th><th className="p-3">Lý do</th><th className="p-3">Giá trị lúc mở</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead><tbody>{rows.map(c => <tr key={c.id} className="border-t"><td className="p-3 whitespace-nowrap">{date(c.openedAt)}</td><td className="max-w-sm p-3">{c.reason}</td><td className="p-3 whitespace-nowrap">{c.amount.toLocaleString("vi-VN")} {c.currency}</td><td className="p-3">{statusLabels[c.status]}{c.assignedTo && <span className="block text-xs text-muted-foreground">{c.assignedTo === profile?.id ? "Bạn đang xử lý" : "Đã có người tiếp nhận"}</span>}</td><td className="p-3"><button type="button" className={button} onClick={() => void open(c.id)}>Xem hồ sơ</button></td></tr>)}{!rows.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Chưa có hồ sơ ở trạng thái này.</td></tr>}</tbody></table></div>}
    <div className="flex justify-between"><button type="button" className={button} disabled={page === 1 || loading} onClick={() => { setLoading(true); setPage(v => v - 1); }}>Trước</button><span>Trang {page}</span><button type="button" className={button} disabled={!hasMore || loading} onClick={() => { setLoading(true); setPage(v => v + 1); }}>Tiếp</button></div>
    {current && <section aria-label="Chi tiết hồ sơ đối soát" className="space-y-4 rounded-xl border p-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Hồ sơ đối soát · {statusLabels[current.status]}</h2><button type="button" className={button} onClick={() => { detailGeneration.current++; setCurrent(null); }}>Đóng</button></div>
      <p>{current.reason}</p><p className="text-sm">Giá trị lúc mở: <strong>{current.amount.toLocaleString("vi-VN")} {current.currency}</strong>. Bên chuyển: {current.direction === "LANDLORD_TO_TENANT" ? "Chủ nhà" : "Người thuê"}. Bên nhận: {current.direction === "LANDLORD_TO_TENANT" ? "Người thuê" : "Chủ nhà"}.</p>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Quyết định chỉ mở lại bước gửi hoặc kiểm tra chứng từ. Bên nhận phải tự xác nhận tiền thực nhận; không đổi số tiền, xóa nghĩa vụ hay hoàn tiền tự động.</p>
      <div className="flex flex-wrap gap-2">{current.evidences.map((e,i) => <button type="button" className={button} key={`${e.storageId}-${i}`} onClick={() => void proof(e.storageId)}>Xem chứng cứ {i+1}</button>)}</div>
      <ol className="max-h-96 space-y-2 overflow-y-auto text-sm">{current.events.map(e => <li className="rounded-lg border bg-muted/20 p-3" key={e.revision}><strong>{actionLabels[e.action] ?? e.action}</strong> · {e.actorRole === "ADMIN" ? "Quản trị viên" : e.actorRole === "LANDLORD" ? "Chủ nhà" : "Người thuê"} · {date(e.occurredAt)}<p>{e.reason}</p>{eventResolution(e.metadataJson) && <p>{eventResolution(e.metadataJson)}</p>}</li>)}</ol>
      {current.resolution && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950"><strong>{resolutionLabels[current.resolution]}</strong><p>{current.resolutionReason}</p><p>Bên nhận vẫn cần xác nhận thực nhận qua thao tác thanh toán riêng.</p></div>}
      {current.allowedActions.length > 0 && <div className="space-y-3">
        <textarea aria-label="Lý do xử lý đối soát" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} placeholder="Căn cứ xử lý / lý do tiếp nhận (10–500 ký tự)" className="min-h-24 w-full rounded-lg border p-3" />
        {current.allowedActions.includes("CLAIM") && <button type="button" className={button} disabled={busy || reason.trim().length < 10} onClick={() => void act("CLAIM")}>{current.assignedTo && current.assignedTo !== profile?.id ? "Chuyển việc xử lý về tôi" : "Tiếp nhận xử lý"}</button>}
        {current.allowedActions.includes("DECIDE") && <div className="space-y-2"><div className="flex flex-wrap gap-3"><select aria-label="Quyết định hướng xử lý" value={resolution} onChange={e => setResolution(e.target.value as DisputeResolution)} className="max-w-full rounded-lg border p-2">{Object.entries(resolutionLabels).map(([value,label]) => <option key={value} value={value} disabled={value === "REVIEW_TRANSFER" && !current.evidences.length}>{label}</option>)}</select><button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={busy || reason.trim().length < 10 || resolution === "REVIEW_TRANSFER" && !current.evidences.length} onClick={() => void act("DECIDE")}>Áp dụng hướng xử lý</button></div>{!current.evidences.length && <p className="text-sm text-muted-foreground">Chưa có chứng cứ; yêu cầu hai bên bổ sung trước khi mở bước kiểm tra tiền đã chuyển.</p>}</div>}
      </div>}
    </section>}
  </div>;
}
