import ListingStatusBadge from "./ListingStatusBadge";
import type { ListingStatusHistoryResponse } from "@/types/listing.type";
import { formatStatusHistoryActor } from "@/utils/listing-status-history";

interface ListingStatusHistoryTimelineProps {
  history: ListingStatusHistoryResponse[];
  currentUserId?: string | null;
  formatDate: (iso?: string | null) => string;
  emptyMessage?: string;
}

export default function ListingStatusHistoryTimeline({
  history,
  currentUserId,
  formatDate,
  emptyMessage = "Chưa có bản ghi lịch sử trạng thái.",
}: ListingStatusHistoryTimelineProps) {
  if (history.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>;
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {history.map((hist) => (
        <div key={hist.id} className="relative space-y-1.5 text-xs">
          <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
          <div className="flex flex-wrap items-center gap-2">
            <ListingStatusBadge status={hist.toStatus} />
            <span className="text-[11px] text-muted-foreground">
              bởi{" "}
              <span className="font-semibold text-foreground">
                {formatStatusHistoryActor(hist, currentUserId)}
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground">• {formatDate(hist.createdAt)}</span>
          </div>
          {hist.reason && (
            <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60">
              &quot;{hist.reason}&quot;
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
