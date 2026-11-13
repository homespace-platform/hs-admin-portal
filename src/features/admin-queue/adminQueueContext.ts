import { createContext, useContext } from "react";
import type { AdminAccess } from "./adminAccess";
import type { QueueStatus } from "./queueController";

export interface AdminQueueValue {
  /** False when disabled by config or the viewer is not a verified ADMIN: show nothing private. */
  active: boolean;
  /** Config flag, so UIs can say "disabled" instead of showing nothing. */
  enabled: boolean;
  /** Why the queue is or is not available (auth/profile/role), so UIs can explain instead of "unavailable". */
  access: AdminAccess;
  /** Verified admin identity the data belongs to; null unless `active`. Key private UI state on it. */
  owner: string | null;
  count: number | null;
  status: QueueStatus;
  /** Bumps on every successful shared count update/recovery. Consumers refetch detail on change; they never poll. */
  version: number;
}

export const AdminQueueContext = createContext<AdminQueueValue>({
  active: false,
  enabled: false,
  access: "loading",
  owner: null,
  count: null,
  status: "loading",
  version: 0,
});

export const useAdminQueue = () => useContext(AdminQueueContext);
