import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useAdminQueue } from "@/features/admin-queue/adminQueueContext";
import { queueBlockedMessage } from "@/features/admin-queue/pendingListing";
import { usePendingListingRequests } from "@/features/admin-queue/usePendingListingRequests";
import PendingListingItem from "@/features/admin-queue/PendingListingItem";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Notification center = the ACTIVE pending-review work queue (new listings and pending edits).
 * Tasks leave it when any admin decides; finished-event history is not available from the existing
 * API, so none is shown. The count comes from the shared provider (no polling here).
 */
export default function NotificationCenterPage() {
  const { active, enabled, access, owner, count, status, version } = useAdminQueue();
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const next = input.trim();
    if (next === keyword) return;
    const t = setTimeout(() => {
      setKeyword(next);
      setPage(1); // a new search starts at page 1
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input, keyword]);

  const denied = status === "forbidden";
  const list = usePendingListingRequests({
    owner,
    enabled: active && !denied,
    page,
    size: PAGE_SIZE,
    keyword,
    version,
  });
  const blocked = queueBlockedMessage(enabled, access, denied);
  const shownCount = active && !denied ? count : null;

  let body;
  if (blocked) {
    body = <p role="status" className="py-12 text-sm text-muted-foreground text-center">{blocked}</p>;
  } else if (list.status === "loading") {
    body = (
      <p role="status" className="py-12 text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Đang tải danh sách chờ xử lý...
      </p>
    );
  } else if (list.status === "forbidden") {
    body = <p role="status" className="py-12 text-sm text-muted-foreground text-center">Không có quyền xem hàng chờ duyệt.</p>;
  } else if (list.status === "error") {
    body = (
      <div role="alert" className="py-12 text-sm text-center space-y-2">
        <p className="text-muted-foreground">Không thể tải danh sách chờ xử lý.</p>
        <button type="button" onClick={list.reload} className="font-bold text-primary hover:underline cursor-pointer">
          Thử lại
        </button>
      </div>
    );
  } else if (list.items.length === 0) {
    body = (
      <div role="status" className="py-12 text-sm text-muted-foreground text-center space-y-2">
        <p>{keyword ? "Không có tin chờ xử lý khớp từ khóa." : "Không có tin đăng nào đang chờ xử lý."}</p>
        {page > 1 && (
          <button type="button" onClick={() => setPage(1)} className="font-bold text-primary hover:underline cursor-pointer">
            Về trang đầu
          </button>
        )}
      </div>
    );
  } else {
    body = (
      <ul className="space-y-3">
        {list.items.map((item) => (
          <li key={item.id}>
            <PendingListingItem item={item} variant="card" />
          </li>
        ))}
      </ul>
    );
  }

  const showPager = !blocked && list.status === "ready" && list.totalPages > 1;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Thông báo</h1>
        {shownCount !== null && (
          <span role="status" className="text-xs font-bold rounded-full bg-destructive/10 text-destructive px-3 py-1">
            {shownCount} chờ xử lý
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Hàng chờ duyệt đang hoạt động: tin đăng mới và bản chỉnh sửa. Mục nào được quản trị viên xử lý sẽ biến khỏi danh sách.
      </p>

      <div role="tablist" aria-label="Loại thông báo" className="flex gap-2 border-b border-border">
        <button type="button" role="tab" aria-selected="true" className="text-sm font-bold text-primary border-b-2 border-primary pb-2">
          Tin đăng
        </button>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Tìm tin chờ xử lý"
          placeholder="Tìm theo tiêu đề, địa chỉ..."
          disabled={Boolean(blocked)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-muted/60 rounded-full border border-border focus:outline-none focus:border-primary"
        />
      </div>

      {body}

      {showPager && (
        <nav aria-label="Phân trang" className="flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-full border border-border disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            Trước
          </button>
          <span className="text-muted-foreground">
            Trang {page}/{list.totalPages} · {list.totalElements} mục
          </span>
          <button
            type="button"
            disabled={page >= list.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-full border border-border disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}
