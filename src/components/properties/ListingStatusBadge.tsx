import type { ListingStatus } from "@/types/listing.type";
import { getListingStatusConfig } from "@/config/listing-status.config";

interface ListingStatusBadgeProps {
  status?: ListingStatus | string | null;
  className?: string;
}

export default function ListingStatusBadge({
  status,
  className = "",
}: ListingStatusBadgeProps) {
  const config = getListingStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition-colors ${config.badgeClassName} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} />
      <span>{config.label}</span>
    </span>
  );
}
