import type {
  ListingStatusActorType,
  ListingStatusHistoryResponse,
} from "@/types/listing.type";

const ACTOR_TYPE_LABELS: Record<ListingStatusActorType, string> = {
  USER: "Chủ tin",
  ADMIN: "Quản trị viên",
  SYSTEM: "Hệ thống",
};

export function formatStatusHistoryActor(
  history: ListingStatusHistoryResponse,
  currentUserId?: string | null,
): string {
  const roleLabel = ACTOR_TYPE_LABELS[history.changedByType] || history.changedByType;
  const isSelf = Boolean(currentUserId && history.changedBy && history.changedBy === currentUserId);
  const name = isSelf ? "Bạn" : history.changedByDisplayName || "Không rõ";
  return `${name} · ${roleLabel}`;
}
