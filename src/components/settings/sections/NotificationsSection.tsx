import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { personalNotificationService as service, type NotificationPreference } from "@/services/personal-notification.service";
import { disablePush, enablePush, getPushStatus, isPushConfigured, isPushOptedIn, type PushStatus } from "@/services/notification-push.service";
import { PolicyNotice } from "@/components/common/PolicyDialog";

const labels: Record<string, string> = {
  SYSTEM: "Hệ thống và cảnh báo vận hành",
  ACCOUNT: "Tài khoản và xác minh KYC",
  LISTING: "Tin đăng",
  APPOINTMENT: "Lịch xem nhà",
  RENTAL_REQUEST: "Yêu cầu thuê và khiếu nại",
  CONTRACT: "Hợp đồng và ký số",
  PAYMENT: "Thanh toán và hóa đơn",
  CHAT: "Tin nhắn",
  NEWS: "Tin tức",
};

export default function NotificationsSection() {
  const { authenticated, userId } = useAuth();
  const [snapshot, setSnapshot] = useState<{ owner: string; version: number; items: NotificationPreference[]; error: boolean } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [pushStatus, setPushStatus] = useState<PushStatus>("disabled");
  const [changingPush, setChangingPush] = useState(false);
  const generation = useRef(0);
  const mutex = useRef(false);
  const owner = authenticated ? userId : null;
  const mine = snapshot?.owner === owner && snapshot?.version === version ? snapshot : null;
  const items = mine?.items ?? [];
  const loading = !!owner && !mine;
  const error = mine?.error;

  useEffect(() => {
    const sync = () => setPushStatus(!isPushConfigured() || !("Notification" in window) || Notification.permission === "denied"
      ? "unavailable" : isPushOptedIn() ? getPushStatus() : "disabled");
    const onStatus = (event: Event) => setPushStatus((event as CustomEvent<PushStatus>).detail);
    sync();
    window.addEventListener("hs:notification-push-status", onStatus);
    return () => window.removeEventListener("hs:notification-push-status", onStatus);
  }, []);

  useEffect(() => {
    const scope = generation, token = ++scope.current;
    if (!owner) return;
    service.preferences().then(result => {
      if (scope.current === token) setSnapshot({ owner, version, items: result, error: false });
    }).catch(() => { if (scope.current === token) setSnapshot({ owner, version, items: [], error: true }); });
    return () => { scope.current++; };
  }, [owner, version]);

  async function setPush(category: string, enabled: boolean) {
    if (mutex.current || !owner) return;
    const token = generation.current;
    mutex.current = true;
    setSaving(category);
    try {
      const result = await service.setPush(category, enabled);
      if (generation.current === token) {
        setSnapshot({ owner, version, items: result, error: false });
        toast.success("Đã lưu cài đặt thông báo.");
      }
    } catch {
      if (generation.current === token) toast.error("Không thể lưu cài đặt thông báo. Hãy thử lại.");
    } finally { mutex.current = false; setSaving(null); }
  }

  async function toggleBrowserPush() {
    setChangingPush(true);
    try {
      if (isPushOptedIn() && pushStatus !== "error") await disablePush();
      else await enablePush();
    } catch { toast.error("Không thể thay đổi thông báo trình duyệt. Hãy thử lại."); }
    finally { setChangingPush(false); }
  }

  return <div className="max-w-2xl space-y-5">
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold"><Bell className="h-4 w-4 text-primary" />Cài đặt thông báo</h3>
      <PolicyNotice tone="neutral" title="Cài đặt thông báo push" summary="Chọn push theo danh mục." text="Chọn push theo danh mục. Thông báo vẫn được lưu trong hộp thư khi bạn tắt kênh này." className="mt-2" />
    </div>
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
      <div>
        <p className="text-sm font-semibold">Thông báo khi không mở trang</p>
        <p className="text-xs text-muted-foreground">{pushStatus === "registered" ? "Đã bật cho trình duyệt này." : pushStatus === "registering" ? "Đang đăng ký trình duyệt…" : pushStatus === "unavailable" ? "Chưa khả dụng trên trình duyệt này. Hãy kiểm tra quyền thông báo trong cài đặt trình duyệt." : pushStatus === "error" ? "Đăng ký chưa thành công. Hãy thử lại." : "Bật để nhận thông báo đẩy trên trình duyệt này."}</p>
      </div>
      <button type="button" disabled={!owner || pushStatus === "unavailable" || changingPush} onClick={() => void toggleBrowserPush()}
        className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
        {changingPush ? "Đang xử lý…" : pushStatus === "error" ? "Thử lại" : isPushOptedIn() ? "Tắt" : "Bật"}
      </button>
    </div>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Đang tải cài đặt…</p> :
      error ? <div role="alert" className="space-y-2 text-sm">Không tải được cài đặt thông báo. <button type="button" className="text-primary underline" onClick={() => setVersion(value => value + 1)}>Thử lại</button></div> :
      <div className="divide-y divide-border rounded-2xl border border-border">
        {items.map(item => <div key={item.category} className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-semibold">{labels[item.category] ?? item.category}</p>
            <p className="text-xs text-muted-foreground">Email: sắp ra mắt</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-xs">
            <span>Push</span>
            <input type="checkbox" aria-label={`${labels[item.category] ?? item.category} - Push`}
              checked={item.push} disabled={saving !== null}
              onChange={event => void setPush(item.category, event.target.checked)}
              className="h-4 w-4 accent-primary" />
          </label>
        </div>)}
      </div>}
  </div>;
}
