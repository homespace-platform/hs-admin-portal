import { useCallback, useEffect, useState } from "react";
import { Activity, LogOut, RefreshCw, Send } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";
import keycloak from "@/lib/keycloak";
import { getTokenSnapshot, type TokenSnapshot } from "@/lib/token-debug";
import { getUserProfileApi } from "@/services/userApi";
import type { UserProfileResponse } from "@/types/UserProfileResponse";

type FlowLog = {
  id: number;
  time: string;
  step: string;
  detail: string;
};

let logId = 0;

const pushLog = (logs: FlowLog[], step: string, detail: string): FlowLog[] => [
  {
    id: ++logId,
    time: new Date().toLocaleTimeString("vi-VN"),
    step,
    detail,
  },
  ...logs.slice(0, 19),
];

export default function HomePage() {
  const { fullName, email, username } = useAuth();
  const displayName = fullName || email || username || "Người dùng";

  const [tokenInfo, setTokenInfo] = useState<TokenSnapshot>(() => getTokenSnapshot());
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [flowLogs, setFlowLogs] = useState<FlowLog[]>([]);

  const refreshTokenInfo = useCallback(() => {
    setTokenInfo(getTokenSnapshot());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refreshTokenInfo, 1000);
    return () => window.clearInterval(timer);
  }, [refreshTokenInfo]);

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const handleCallApi = async () => {
    setApiLoading(true);
    setApiError(null);
    setFlowLogs((prev) =>
      pushLog(prev, "1. User click", "Bấm Gọi API /api/v1/users/me/profile"),
    );

    try {
      setFlowLogs((prev) =>
        pushLog(
          prev,
          "2. axios interceptor",
          "updateToken(30) — refresh nếu còn < 30s",
        ),
      );

      const before = getTokenSnapshot();
      setFlowLogs((prev) =>
        pushLog(
          prev,
          "3. Gắn header",
          `Authorization: Bearer ${before.accessTokenPreview ?? "null"}`,
        ),
      );

      const data = await getUserProfileApi();
      const after = getTokenSnapshot();

      setProfile(data.result);
      setFlowLogs((prev) =>
        pushLog(
          prev,
          "4. Gateway :8080",
          "Verify JWT → inject X-User-* → forward user-service",
        ),
      );
      setFlowLogs((prev) =>
        pushLog(
          prev,
          "5. Response OK",
          `Profile: ${data.result.username} (${data.result.email})`,
        ),
      );

      if (before.accessTokenPreview !== after.accessTokenPreview) {
        setFlowLogs((prev) =>
          pushLog(
            prev,
            "↻ Token refreshed",
            `Access token đã đổi sau updateToken: ${after.accessTokenPreview}`,
          ),
        );
      }

      refreshTokenInfo();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gọi API thất bại";
      setApiError(message);
      setFlowLogs((prev) =>
        pushLog(prev, "✕ Lỗi", message),
      );
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold text-slate-800">
            HomeSpace Admin
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" data-icon="inline-start" />
            Đăng xuất
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <section>
          <h1 className="text-2xl font-bold text-slate-800">
            Xin chào, {displayName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Trang demo luồng JWT: token nằm ở RAM, mỗi API gắn Bearer qua
            axios interceptor.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600" />
            <h2 className="font-semibold text-slate-800">
              Token đang nằm ở đâu? (F5 / Network tab `token`)
            </h2>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Vị trí lưu" value={tokenInfo.storage} />
            <InfoRow
              label="Authenticated"
              value={tokenInfo.authenticated ? "true" : "false"}
            />
            <InfoRow label="Subject (sub)" value={tokenInfo.subject ?? "—"} />
            <InfoRow
              label="Access token hết hạn"
              value={
                tokenInfo.expiresAt
                  ? `${tokenInfo.expiresAt} (còn ${tokenInfo.expiresInSeconds}s)`
                  : "—"
              }
            />
            <InfoRow
              label="Refresh token còn"
              value={
                tokenInfo.refreshExpiresInSeconds != null
                  ? `${tokenInfo.refreshExpiresInSeconds}s`
                  : "—"
              }
            />
            <InfoRow
              label="Access token (preview)"
              value={tokenInfo.accessTokenPreview ?? "—"}
              mono
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
            <p>
              <strong>F5 reload:</strong> RAM bị xóa →{" "}
              <code className="text-teal-700">keycloak.init(check-sso)</code>{" "}
              kiểm tra session cookie trên Keycloak (:9000). Nếu session còn,
              bạn thấy request <code className="text-teal-700">token</code>{" "}
              trong Network — đó là Keycloak cấp token mới vào RAM, không phải
              đọc từ localStorage.
            </p>
            <p>
              <strong>Cookie Keycloak</strong> nằm trên domain{" "}
              <code className="text-teal-700">localhost:9000</code> (browser
              không cho JS đọc). Frontend chỉ giữ JWT trong object{" "}
              <code className="text-teal-700">keycloak.token</code>.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Test gọi API</h2>
          <p className="text-sm text-slate-500">
            GET{" "}
            <code className="text-teal-700">
              http://localhost:8080/api/v1/users/me/profile
            </code>
          </p>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCallApi} disabled={apiLoading}>
              <Send className="h-4 w-4" data-icon="inline-start" />
              {apiLoading ? "Đang gọi..." : "Gọi API (qua Gateway)"}
            </Button>
            <Button variant="outline" onClick={refreshTokenInfo}>
              <RefreshCw className="h-4 w-4" data-icon="inline-start" />
              Cập nhật token info
            </Button>
          </div>

          {apiError && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 p-3">
              {apiError}
            </p>
          )}

          {profile && (
            <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4 text-sm">
              <p className="font-medium text-teal-900">Response từ user-service</p>
              <pre className="mt-2 overflow-x-auto text-xs text-slate-700">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Luồng thực tế (log)</h2>
          {flowLogs.length === 0 ? (
            <p className="text-sm text-slate-400">
              Bấm &quot;Gọi API&quot; để xem từng bước.
            </p>
          ) : (
            <ul className="space-y-2">
              {flowLogs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-xs"
                >
                  <span className="text-slate-400">{log.time}</span>
                  <span className="mx-2 font-medium text-teal-700">
                    {log.step}
                  </span>
                  <span className="text-slate-600">{log.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`mt-0.5 text-slate-700 ${mono ? "font-mono text-[11px] break-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
