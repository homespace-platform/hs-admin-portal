import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAppSelector } from "@/store/hooks";
import { resolveAdminAccess } from "@/features/admin-queue/adminAccess";
import { personalNotificationService } from "@/services/personal-notification.service";
import { PersonalNotificationContext } from "./personalNotificationContext";
import { io } from "socket.io-client";
import keycloak from "@/lib/keycloak";

export default function PersonalNotificationProvider({ children }: { children: ReactNode }) {
  const auth = useAppSelector(state => state.auth), user = useAppSelector(state => state.user);
  const access = resolveAdminAccess(auth, user);
  const owner = access.access === "ready" ? access.userId : null;
  const [snapshot, setSnapshot] = useState<{ owner: string; count: number | null; version: number; error: boolean } | null>(null);
  const refreshRef = useRef<() => void>(() => {});
  const refresh = useCallback(() => refreshRef.current(), []);
  useEffect(() => {
    if (!owner) return;
    let disposed = false, inFlight = false, queued = false, blocked = false, connected = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;
    let lastStarted = 0;
    const schedule = (delay: number) => { clearTimeout(timer); if (!disposed && !blocked) timer = setTimeout(() => void load(), delay); };
    const load = async (forced = false) => {
      if (disposed || blocked || document.visibilityState === "hidden" || navigator.onLine === false) return;
      if (inFlight) { queued ||= forced; return; }
      if (!forced && Date.now() - lastStarted < 10_000) { schedule(10_000); return; }
      inFlight = true; lastStarted = Date.now(); request = new AbortController();
      try {
        const count = await personalNotificationService.unread(request.signal);
        if (!disposed) setSnapshot(previous => ({ owner, count, version: (previous?.owner === owner ? previous.version : 0) + 1, error: false }));
      } catch (cause) {
        const status = (cause as { response?: { status?: number } }).response?.status;
        blocked = status === 401 || status === 403;
        if (!disposed && !request.signal.aborted) setSnapshot(previous => ({ owner, count: previous?.owner === owner ? previous.count : null, version: previous?.owner === owner ? previous.version : 0, error: true }));
      } finally {
        inFlight = false;
        if (queued) { queued = false; if (!disposed) void load(true); }
        else if (!connected) schedule(30_000);
      }
    };
    const gateway = new URL(import.meta.env.VITE_GATEWAY_BASE_URL, window.location.origin);
    const prefix = gateway.pathname.replace(/\/$/, "").replace(/\/api\/v1$/, "");
    const socket = io(`${gateway.origin}/notifications`, {
      path: `${prefix}/api/v1/notifications/socket.io`, transports: ["websocket"], autoConnect: false,
      auth: callback => { void keycloak.updateToken(30).then(() => {
        if (!disposed) callback({ token: keycloak.token });
      }).catch(() => { if (!disposed) callback({ token: "" }); }); },
    });
    let coalesced: ReturnType<typeof setTimeout> | undefined;
    const changed = () => { clearTimeout(coalesced); coalesced = setTimeout(() => void load(true), 150); };
    socket.on("connect", () => { connected = true; clearTimeout(timer); changed(); });
    for (const event of ["notification:new", "notification:read", "notification:deleted", "notification:unread-count"]) socket.on(event, changed);
    socket.on("disconnect", reason => {
      connected = false; schedule(30_000);
      if (reason === "io server disconnect" && !disposed) socket.connect();
    });
    socket.on("connect_error", () => { connected = false; schedule(30_000); });
    const tokenTimer = setInterval(() => {
      const previous = keycloak.token;
      void keycloak.updateToken(60).then(() => {
        if (!disposed && (previous !== keycloak.token || !socket.connected)) socket.disconnect().connect();
      }).catch(() => socket.disconnect());
    }, 30_000);
    socket.connect();
    const resume = () => { clearTimeout(timer); void load(); };
    refreshRef.current = () => { void load(true); };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume); window.addEventListener("online", resume);
    void load();
    return () => {
      disposed = true; clearTimeout(timer); clearTimeout(coalesced); clearInterval(tokenTimer); socket.disconnect(); request?.abort(); refreshRef.current = () => {};
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume); window.removeEventListener("online", resume);
    };
  }, [owner]);
  const mine = snapshot?.owner === owner ? snapshot : null;
  return <PersonalNotificationContext.Provider value={{ owner, count: mine?.count ?? null, version: mine?.version ?? 0, error: mine?.error ?? false, refresh }}>{children}</PersonalNotificationContext.Provider>;
}
