import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersonalNotifications } from "@/features/notifications/personalNotificationContext";
import { PERMISSIONS } from "@/config/permissions";
import { useHasPermission } from "@/hooks/usePermission";
import { listOperationalIncidents, type OperationalIncident } from "@/services/personal-notification.service";
import { PolicyNotice } from "@/components/common/PolicyDialog";

export default function SystemAlertsPage() {
  const { owner, version, refresh } = usePersonalNotifications();
  const [search] = useSearchParams();
  const canView = useHasPermission(PERMISSIONS.INCIDENT_VIEW);
  const [snapshot, setSnapshot] = useState<{ owner: string; items: OperationalIncident[] } | null>(null);
  const [error, setError] = useState("");
  const mine = snapshot?.owner === owner ? snapshot : null;
  const selected = search.get("incidentId");
  useEffect(() => {
    if (!owner || !canView) return;
    let disposed = false;
    const controller = new AbortController();
    void listOperationalIncidents(controller.signal).then(items => {
      if (!disposed) { setSnapshot({ owner, items }); setError(""); }
    }).catch(() => { if (!disposed) setError("Không tải được cảnh báo hệ thống. Hãy thử lại."); });
    return () => { disposed = true; controller.abort(); };
  }, [owner, version, canView]);
  return <section className="max-w-3xl space-y-4">
    <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Cảnh báo vận hành</h1><button type="button" onClick={refresh}>Tải lại</button></div>
    <PolicyNotice tone="neutral" title="Lưu ý về cảnh báo vận hành" summary="Tối đa 100 sự cố gần nhất." text="Tối đa 100 sự cố gần nhất. Thông báo phục hồi không thay thế việc kiểm tra hồ sơ liên quan." />
    {error && <p role="alert">{error}</p>}
    {!canView && <p role="alert">Bạn không có quyền xem cảnh báo vận hành.</p>}
    {canView && !mine && !error && <p role="status">Đang tải cảnh báo…</p>}
    {mine?.items.length === 0 && <p>Chưa có sự cố được ghi nhận.</p>}
    {mine && selected && !mine.items.some(item => item.id === selected) && <p role="status">Sự cố được chọn không nằm trong danh sách gần nhất hoặc bạn không có quyền xem.</p>}
    <ul className="space-y-3">{mine?.items.map(item => <li key={item.id} id={`incident-${item.id}`} aria-current={selected === item.id ? "true" : undefined}
      className={`rounded-xl border p-4 space-y-2 ${selected === item.id ? "border-primary ring-1 ring-primary" : "border-border"}`}>
      <h2 className="font-semibold">{item.component} · {item.open ? "Cần kiểm tra" : "Đã phục hồi"}</h2>
      <p className="text-sm">Ghi nhận: {new Date(item.openedAt).toLocaleString("vi-VN")}</p>
      {item.resolvedAt && <p className="text-sm">Phục hồi: {new Date(item.resolvedAt).toLocaleString("vi-VN")}</p>}
      <p className="text-xs text-muted-foreground">Mã sự cố: {item.id}{item.resourceId ? ` · Hồ sơ: ${item.resourceId}` : ""}</p>
    </li>)}</ul>
  </section>;
}
