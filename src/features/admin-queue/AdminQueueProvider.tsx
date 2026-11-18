import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { parseAdminQueueAlertsConfig } from "@/config/admin-queue-alerts.config";
import { adminListingService } from "@/services/admin-listing.service";
import { useAppSelector } from "@/store/hooks";
import { PERMISSIONS } from "@/config/permissions";
import { useHasPermission } from "@/hooks/usePermission";
import { resolveAdminAccess } from "./adminAccess";
import { AdminQueueContext, type AdminQueueValue } from "./adminQueueContext";
import { createQueueController, type QueueSnapshot } from "./queueController";

const config = parseAdminQueueAlertsConfig(import.meta.env);
const TOAST_ID = "admin-queue-pending";
export const QUEUE_REQUEST_TIMEOUT_MS = 15_000;

type Held = QueueSnapshot & { owner: string; version: number };

/** Mount once in the authenticated AdminLayout; Header, Sidebar and the center share its single poller. */
export function AdminQueueProvider({ children }: { children: ReactNode }) {
  const auth = useAppSelector((s) => s.auth);
  const user = useAppSelector((s) => s.user);
  const { access, userId } = resolveAdminAccess(auth, user);
  // The queue polls /admin/listings (LISTING_VIEW): without it, never start the poller.
  const canViewListings = useHasPermission(PERMISSIONS.LISTING_VIEW);
  const owner = config.enabled && access === "ready" && canViewListings ? userId : null;
  const [held, setHeld] = useState<Held | null>(null);

  useEffect(() => {
    if (!owner) return;
    const controller = createQueueController({
      fetchCounts: (signal) => adminListingService.getStatusCounts(signal, QUEUE_REQUEST_TIMEOUT_MS),
      pollIntervalMs: config.pollIntervalMs,
      popupCooldownMs: config.popupCooldownMs,
      onSnapshot: (s) =>
        setHeld((prev) => ({
          ...s,
          owner,
          version: (prev?.owner === owner ? prev.version : 0) + (s.status === "ready" ? 1 : 0),
        })),
      onIncrease: (n) => toast.info(`Hiện có ${n} tin đăng/bản chỉnh sửa chờ duyệt`, { id: TOAST_ID }),
    });
    const off = adminListingService.onModerationChange(() => controller.refresh());
    controller.start();
    return () => {
      off();
      controller.destroy();
      toast.dismiss(TOAST_ID);
      setHeld(null); // never let a previous session's counts reappear for the same identity
    };
  }, [owner]);

  // Counts held for another identity are hidden in the same render the identity changes.
  const mine = held && held.owner === owner ? held : null;
  const value = useMemo<AdminQueueValue>(
    () => ({
      active: owner !== null,
      enabled: config.enabled,
      access,
      owner,
      count: mine?.count ?? null,
      status: mine?.status ?? "loading",
      version: mine?.version ?? 0,
    }),
    [owner, access, mine?.count, mine?.status, mine?.version],
  );

  return <AdminQueueContext.Provider value={value}>{children}</AdminQueueContext.Provider>;
}
