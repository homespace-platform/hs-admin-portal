import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePersonalNotifications } from "@/features/notifications/personalNotificationContext";
import { personalNotificationPath, personalNotificationService as service, type PersonalNotification } from "@/services/personal-notification.service";

export default function PersonalNotificationsPage() {
  const { owner, version, refresh } = usePersonalNotifications();
  const [snapshot, setSnapshot] = useState<{ owner: string; items: PersonalNotification[]; cursor: string | null } | null>(null);
  const [error, setError] = useState(""), [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
  const generation = useRef(0), mutex = useRef(false);
  const mine = snapshot?.owner === owner ? snapshot : null;
  useEffect(() => {
    const scope = generation, token = ++scope.current, request = new AbortController();
    if (owner) void service.feed(undefined, request.signal).then(page => {
      if (scope.current === token) { setSnapshot({ owner, items: page.items, cursor: page.hasMore ? page.nextCursor : null }); setError(""); }
    }).catch(() => { if (scope.current === token) setError("Không tải được thông báo. Hãy thử lại."); });
    return () => { scope.current++; request.abort(); };
  }, [owner, version]);
  async function more() {
    if (!owner || !mine?.cursor || mutex.current) return;
    const token = generation.current; mutex.current = true; setLoading(true);
    try {
      const page = await service.feed(mine.cursor);
      if (generation.current === token) setSnapshot(previous => previous?.owner === owner ? { owner, items: [...previous.items, ...page.items.filter(item => !previous.items.some(old => old.id === item.id))], cursor: page.hasMore ? page.nextCursor : null } : previous);
    } catch { if (generation.current === token) setError("Không tải được trang tiếp theo."); }
    finally { mutex.current = false; setLoading(false); }
  }
  async function mutate(action: () => Promise<unknown>) {
    if (!owner || mutex.current) return;
    const token = generation.current; mutex.current = true; setBusy(true);
    try { await action(); if (generation.current === token) { setError(""); refresh(); } }
    catch { if (generation.current === token) setError("Thao tác chưa hoàn tất. Hãy thử lại."); }
    finally { mutex.current = false; setBusy(false); }
  }
  return <section className="max-w-3xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-bold">Thông báo cá nhân</h1>
      <div className="flex gap-3 text-sm"><button type="button" onClick={refresh}>Tải lại</button><button type="button" disabled={!owner || busy} onClick={() => void mutate(service.readAll)}>Đọc tất cả</button></div>
    </div>
    <Link to="/notifications" className="text-sm text-primary underline">Mở hàng chờ duyệt tin đăng →</Link>
    {error && <p role="alert">{error}</p>}
    {!owner ? <p role="status">Đang xác nhận tài khoản quản trị.</p> : !mine && !error ? <p role="status">Đang tải thông báo…</p> : mine?.items.length === 0 ? <p>Chưa có thông báo.</p> : null}
    <ul className="space-y-3">{mine?.items.map(item => {
      const path = personalNotificationPath(item, !!owner);
      return <li key={item.id} className={`rounded-2xl border p-4 space-y-2 ${item.readAt ? "border-border" : "border-primary/40 bg-primary/5"}`}>
        <h2 className="font-semibold">{item.title}</h2><p className="whitespace-pre-wrap text-sm">{item.body}</p>
        <time className="text-xs text-muted-foreground" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("vi-VN")}</time>
        <div className="flex gap-4 text-sm">
          {path && (path.startsWith("http")
            ? <a href={path} className="text-primary underline" onClick={() => { if (!item.readAt) void mutate(() => service.read(item.id)); }}>Xem chi tiết ↗</a>
            : <Link to={path} className="text-primary underline" onClick={() => { if (!item.readAt) void mutate(() => service.read(item.id)); }}>Xem chi tiết</Link>)}
          {!item.readAt && <button type="button" disabled={busy} onClick={() => void mutate(() => service.read(item.id))}>Đánh dấu đã đọc</button>}
          <button type="button" disabled={busy} onClick={() => void mutate(() => service.remove(item.id))}>Xóa</button>
        </div>
      </li>;
    })}</ul>
    {mine?.cursor && <button type="button" disabled={loading || busy} onClick={() => void more()}>{loading ? "Đang tải…" : "Xem thêm"}</button>}
  </section>;
}
