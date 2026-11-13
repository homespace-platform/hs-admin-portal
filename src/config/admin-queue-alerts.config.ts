/**
 * Admin moderation-queue alerts config (Vite vars are PUBLIC and baked at build time:
 * restart `npm run dev` / rebuild after changing them).
 *
 * - VITE_ADMIN_QUEUE_ALERTS_ENABLED: literal "true"/"false". Missing/blank => true.
 *   Any other value fails CLOSED (disabled).
 * - VITE_ADMIN_QUEUE_POLL_INTERVAL_MS: default 30000, clamped to [10000, 300000].
 * - VITE_ADMIN_QUEUE_POPUP_COOLDOWN_MS: default 60000, clamped to [10000, 3600000].
 * Non-numeric values fall back to the default.
 */
export interface AdminQueueAlertsConfig {
  enabled: boolean;
  pollIntervalMs: number;
  popupCooldownMs: number;
}

interface QueueAlertsEnv {
  VITE_ADMIN_QUEUE_ALERTS_ENABLED?: string;
  VITE_ADMIN_QUEUE_POLL_INTERVAL_MS?: string;
  VITE_ADMIN_QUEUE_POPUP_COOLDOWN_MS?: string;
}

function clampMs(raw: string | undefined, fallback: number, min: number, max: number) {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

export function parseAdminQueueAlertsConfig(env: QueueAlertsEnv): AdminQueueAlertsConfig {
  const flag = env.VITE_ADMIN_QUEUE_ALERTS_ENABLED?.trim();
  return {
    enabled: flag === undefined || flag === "" ? true : flag === "true",
    pollIntervalMs: clampMs(env.VITE_ADMIN_QUEUE_POLL_INTERVAL_MS, 30_000, 10_000, 300_000),
    popupCooldownMs: clampMs(env.VITE_ADMIN_QUEUE_POPUP_COOLDOWN_MS, 60_000, 10_000, 3_600_000),
  };
}
