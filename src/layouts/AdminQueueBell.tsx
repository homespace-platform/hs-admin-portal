import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Loader2 } from "lucide-react";
import { useAdminQueue } from "@/features/admin-queue/adminQueueContext";
import { formatQueueBadge } from "@/features/admin-queue/queueController";
import { usePendingListingRequests } from "@/features/admin-queue/usePendingListingRequests";
import PendingListingItem from "@/features/admin-queue/PendingListingItem";
import { queueBlockedMessage } from "@/features/admin-queue/pendingListing";

const PREVIEW_SIZE = 5;

/**
 * Bell with the shared pending-review count and a preview of the real pending items.
 * This is a work queue, not a read/unread history: opening it never changes the count, and there is
 * no "mark all read". Detail rows are fetched only while open and authorized; no polling here.
 */
export default function AdminQueueBell() {
  const { active, enabled, access, owner, count, status, version } = useAdminQueue();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const denied = status === "forbidden";
  const preview = usePendingListingRequests({
    owner,
    enabled: open && active && !denied,
    page: 1,
    size: PREVIEW_SIZE,
    version,
  });

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const shown = active && !denied ? count : null;
  const label = shown !== null ? `Cần xử lý: ${shown} tin đăng/bản chỉnh sửa chờ duyệt` : "Cần xử lý";

  const blocked = queueBlockedMessage(enabled, access, denied);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={label}
        className="relative w-10 h-10 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
      >
        <ClipboardList className="w-4 h-4" />
        {shown !== null && shown > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none shadow-xs"
          >
            {formatQueueBadge(shown)}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Cần xử lý"
          className="absolute right-0 mt-2.5 w-[min(24rem,calc(100vw-2rem))] bg-popover text-popover-foreground rounded-2xl shadow-2xl border border-border z-50 overflow-hidden focus:outline-none"
        >
          <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Cần xử lý</h2>
            {shown !== null && (
              <span role="status" className="text-[11px] font-bold rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
                {shown} chờ xử lý
              </span>
            )}
          </div>
          <div role="tablist" aria-label="Loại thông báo" className="px-4 pb-2 flex gap-2 border-b border-border">
            <button type="button" role="tab" aria-selected="true" className="text-xs font-bold text-primary border-b-2 border-primary pb-1.5">
              Tin đăng
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border/60" role="tabpanel">
            {blocked ? (
              <p role="status" className="px-4 py-6 text-xs text-muted-foreground text-center">
                {blocked}
              </p>
            ) : preview.status === "loading" ? (
              <p role="status" className="px-4 py-6 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Đang tải danh sách chờ xử lý...
              </p>
            ) : preview.status === "forbidden" ? (
              <p role="status" className="px-4 py-6 text-xs text-muted-foreground text-center">
                Không có quyền xem hàng chờ duyệt.
              </p>
            ) : preview.status === "error" ? (
              <div role="alert" className="px-4 py-6 text-xs text-center space-y-2">
                <p className="text-muted-foreground">Không thể tải danh sách chờ xử lý.</p>
                <button type="button" onClick={preview.reload} className="font-bold text-primary hover:underline cursor-pointer">
                  Thử lại
                </button>
              </div>
            ) : preview.items.length === 0 ? (
              <p role="status" className="px-4 py-6 text-xs text-muted-foreground text-center">
                Không có tin đăng nào đang chờ xử lý.
              </p>
            ) : (
              preview.items.map((item) => (
                <PendingListingItem key={item.id} item={item} variant="compact" onNavigate={() => setOpen(false)} />
              ))
            )}
          </div>

          {active && status === "stale" && (
            <p className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border">
              Không thể cập nhật lúc này, số liệu có thể đã cũ.
            </p>
          )}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center px-4 py-3 border-t border-border text-xs font-bold text-primary hover:bg-muted/60"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </div>
  );
}
