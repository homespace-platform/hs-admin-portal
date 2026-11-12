import { useState, type FormEvent } from "react";
import { AlertTriangle, Bell, Send } from "lucide-react";
import { toast } from "sonner";
import {
  broadcastNotification,
  type BroadcastPriority,
} from "@/services/admin-notification.service";
import { getApiErrorMessage } from "@/utils/apiError";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<BroadcastPriority>("NORMAL");
  const [sending, setSending] = useState(false);
  const [retryId, setRetryId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const request = {
      broadcastId: retryId ?? crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      priority,
    };
    if (!request.title || !request.body) {
      toast.error("Hãy nhập tiêu đề và nội dung thông báo.");
      return;
    }
    if (!window.confirm("Gửi thông báo này tới toàn bộ tài khoản người dùng HomeSpace?")) return;

    setRetryId(request.broadcastId);
    setSending(true);
    try {
      const result = await broadcastNotification(request);
      toast.success(`Đã tạo thông báo cho ${result.recipientCount} tài khoản người dùng.`);
      setTitle("");
      setBody("");
      setPriority("NORMAL");
      setRetryId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể gửi thông báo."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6 pb-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Vận hành &amp; Hỗ trợ
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Thông báo hệ thống
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gửi thông báo tới toàn bộ tài khoản người dùng. Thông báo sẽ xuất hiện trong trung tâm thông báo của họ.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-foreground">Loại thông báo</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${priority === "NORMAL" ? "border-primary bg-primary/5" : "border-border"}`}>
              <input
                type="radio"
                name="priority"
                value="NORMAL"
                checked={priority === "NORMAL"}
                onChange={() => { setPriority("NORMAL"); setRetryId(null); }}
                disabled={sending}
                className="mt-1"
              />
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span><strong className="block text-sm">Thông thường</strong><span className="text-xs text-muted-foreground">Cập nhật chung từ HomeSpace.</span></span>
            </label>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${priority === "HIGH" ? "border-primary bg-primary/5" : "border-border"}`}>
              <input
                type="radio"
                name="priority"
                value="HIGH"
                checked={priority === "HIGH"}
                onChange={() => { setPriority("HIGH"); setRetryId(null); }}
                disabled={sending}
                className="mt-1"
              />
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span><strong className="block text-sm">Quan trọng</strong><span className="text-xs text-muted-foreground">Ưu tiên cao cho cập nhật cần chú ý.</span></span>
            </label>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${priority === "URGENT" ? "border-destructive bg-destructive/5" : "border-border"}`}>
              <input
                type="radio"
                name="priority"
                value="URGENT"
                checked={priority === "URGENT"}
                onChange={() => { setPriority("URGENT"); setRetryId(null); }}
                disabled={sending}
                className="mt-1"
              />
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <span><strong className="block text-sm">Khẩn cấp</strong><span className="text-xs text-muted-foreground">Thông tin cần được chú ý ngay.</span></span>
            </label>
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="broadcast-title" className="text-sm font-bold text-foreground">Tiêu đề</label>
          <input
            id="broadcast-title"
            className="form-input"
            value={title}
            onChange={(event) => { setTitle(event.target.value); setRetryId(null); }}
            maxLength={200}
            required
            disabled={sending}
            placeholder="Ví dụ: Thông báo bảo trì hệ thống"
          />
          <p className="text-right text-xs text-muted-foreground">{title.length}/200</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="broadcast-body" className="text-sm font-bold text-foreground">Nội dung</label>
          <textarea
            id="broadcast-body"
            className="form-input min-h-36 resize-y"
            value={body}
            onChange={(event) => { setBody(event.target.value); setRetryId(null); }}
            maxLength={2000}
            required
            disabled={sending}
            placeholder="Nhập nội dung người dùng sẽ nhìn thấy..."
          />
          <p className="text-right text-xs text-muted-foreground">{body.length}/2000</p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {sending ? "Đang gửi..." : "Gửi đến tất cả người dùng"}
        </button>
      </form>
    </div>
  );
}
