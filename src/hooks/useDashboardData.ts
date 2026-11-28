import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { getDashboardData } from "@/services/admin-dashboard.service";
import { getApiErrorMessage } from "@/utils/userUtils";

export function useDashboardData<T>(
  path: string | null,
  load = getDashboardData<T>,
) {
  const owner = useAppSelector((state) => state.user.profile?.id);
  const permissions = useAppSelector((state) => state.permission.granted).join(
    ",",
  );
  const [version, setVersion] = useState(0);
  const key = `${owner}/${permissions}/${path}/${version}`;
  const [snapshot, setSnapshot] = useState<{
    key: string;
    data?: T;
    error?: string;
  } | null>(null);
  useEffect(() => {
    if (!owner || !path) return;
    const controller = new AbortController();
    void load(path, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSnapshot({ key, data });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setSnapshot({
            key,
            error: getApiErrorMessage(
              cause,
              "Không tải được dữ liệu. Vui lòng thử lại.",
            ),
          });
      });
    return () => controller.abort();
  }, [owner, path, key, load]);
  const current = snapshot?.key === key ? snapshot : null;
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return {
    data: current?.data,
    error: current?.error,
    loading: Boolean(path && owner && !current),
    refresh,
  };
}
