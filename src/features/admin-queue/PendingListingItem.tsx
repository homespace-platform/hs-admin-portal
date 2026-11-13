import { Link } from "react-router-dom";
import { FilePenLine, FilePlus2 } from "lucide-react";
import type { AdminListingSummaryResponse } from "@/types/listing.type";
import { formatSubmittedAt, isPendingEdit, pendingKindLabel, pendingListingHref } from "./pendingListing";

interface Props {
  item: AdminListingSummaryResponse;
  variant: "compact" | "card";
  onNavigate?: () => void;
}

/** One real pending-review row. New listing vs pending edit is decided by `pendingEditId`. */
export default function PendingListingItem({ item, variant, onNavigate }: Props) {
  const edit = isPendingEdit(item);
  const Icon = edit ? FilePenLine : FilePlus2;
  const compact = variant === "compact";
  return (
    <Link
      to={pendingListingHref(item.id)}
      onClick={onNavigate}
      className={`flex items-start gap-3 hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        compact ? "px-4 py-3" : "rounded-2xl border border-border bg-card p-4 shadow-2xs"
      }`}
    >
      <span
        className={`shrink-0 rounded-full flex items-center justify-center ${compact ? "w-8 h-8" : "w-10 h-10"} ${
          edit ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-xs font-bold text-foreground">{pendingKindLabel(item)}</span>
        <span className="block text-xs text-muted-foreground truncate">{item.title || "(Chưa có tiêu đề)"}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground/80">
          <span>{formatSubmittedAt(item.submittedAt)}</span>
          <span className="font-semibold text-amber-600">Chờ xử lý</span>
        </span>
      </span>
    </Link>
  );
}
