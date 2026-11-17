import axiosClient from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api.type";

export interface PersonalNotification {
  id: string;
  category: string;
  type: string;
  title: string;
  body: string;
  actionPath: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
}
export interface PersonalNotificationPage {
  items: PersonalNotification[];
  nextCursor: string | null;
  hasMore: boolean;
}
export interface NotificationPreference {
  category: string;
  push: boolean;
  email: boolean;
}
const base = "/api/v1/notifications";

export function personalNotificationPath(item: PersonalNotification, isAdmin: boolean): string | null {
  const caseId = item.metadata?.caseId;
  if (item.type.startsWith("COMPLAINT_") && item.metadata?.audience === "ADMIN") {
    return isAdmin && typeof caseId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(caseId)
      ? `/operations/complaints?caseId=${encodeURIComponent(caseId)}` : null;
  }
  if (["SYSTEM_INCIDENT_OPENED", "SYSTEM_INCIDENT_RESOLVED"].includes(item.type)) {
    const incidentId = item.metadata?.incidentId;
    return isAdmin && typeof incidentId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(incidentId)
      ? `/operations/system-alerts?incidentId=${encodeURIComponent(incidentId)}` : null;
  }
  // Client business routes are not interchangeable with administration routes.
  if (item.actionPath === "/settings/account-security") return item.actionPath;
  const path = item.actionPath;
  if (!path || !/^\/(?:dashboard(?:\/|\?|$)|chat(?:\/|\?|$)|news(?:\/|\?|$)|notifications(?:\/|\?|$)|settings(?:\/|\?|$)|favorites(?:\/|\?|$)|rent(?:\/|\?|$))/.test(path)
      || path.startsWith("//") || path.includes("\\") || /\s/.test(path) || [...path].some(character => character.charCodeAt(0) < 32)
      || /(^|\/)\.\.(\/|$|\?|#)/.test(path) || path.includes("://")) return null;
  const base = import.meta.env.VITE_WEB_APP_URL;
  if (!base) throw new Error("VITE_WEB_APP_URL is required for notification links");
  const origin = new URL(base);
  if (!/^https?:$/.test(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("VITE_WEB_APP_URL must be an HTTP(S) origin");
  }
  return new URL(path, origin).href;
}

export const personalNotificationService = {
  async preferences(): Promise<NotificationPreference[]> {
    const { data } = await axiosClient.get<ApiResponse<{ items: NotificationPreference[] }>>(`${base}/preferences`, { timeout: 10_000 });
    return data.result.items;
  },
  async setPush(category: string, enabled: boolean): Promise<NotificationPreference[]> {
    const { data } = await axiosClient.patch<ApiResponse<{ items: NotificationPreference[] }>>(`${base}/preferences`, { category, channel: "push", enabled }, { timeout: 10_000 });
    return data.result.items;
  },
  async feed(cursor?: string, signal?: AbortSignal): Promise<PersonalNotificationPage> {
    const { data } = await axiosClient.get<ApiResponse<PersonalNotificationPage>>(`${base}/feed`, { params: { limit: 20, cursor }, signal, timeout: 10_000 });
    return data.result;
  },
  async unread(signal?: AbortSignal): Promise<number> {
    const { data } = await axiosClient.get<ApiResponse<{ count: number }>>(`${base}/unread-count`, { signal, timeout: 10_000 });
    if (!Number.isSafeInteger(data.result?.count) || data.result.count < 0) throw new Error("Số thông báo không hợp lệ.");
    return data.result.count;
  },
  async read(id: string) {
    const { data } = await axiosClient.patch<ApiResponse<PersonalNotification>>(`${base}/${encodeURIComponent(id)}/read`);
    return data.result;
  },
  async readAll() { await axiosClient.patch(`${base}/read-all`); },
  async remove(id: string) { await axiosClient.delete(`${base}/${encodeURIComponent(id)}`); },
};

export interface OperationalIncident {
  id: string;
  component: "BLOCKCHAIN" | "GATEWAY";
  resourceId?: string;
  open: boolean;
  openedAt: string;
  resolvedAt?: string | null;
}
export async function listOperationalIncidents(signal?: AbortSignal): Promise<OperationalIncident[]> {
  return (await axiosClient.get<ApiResponse<OperationalIncident[]>>("/api/v1/admin/operational-incidents", { signal, timeout: 10_000 })).data.result;
}
