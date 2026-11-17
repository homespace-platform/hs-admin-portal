import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "@/lib/keycloak";
import { sessionCleared } from "@/features/auth/authSlice";
import { userCleared } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { unregisterPushBeforeLogout } from "@/services/notification-push.service";

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const user = useAppSelector((state) => state.user);

  const login = useCallback(
    () => void keycloak.login({ redirectUri: window.location.origin + "/dashboard" }),
    [],
  );

  const logout = useCallback(async () => {
    try { await unregisterPushBeforeLogout(); } catch { /* Continue logout if the notification service is unavailable. */ }
    dispatch(sessionCleared());
    dispatch(userCleared());
    navigate("/");
    void keycloak.logout({ redirectUri: window.location.origin });
  }, [dispatch, navigate]);

  const fullName =
    user.profile?.firstName && user.profile?.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.profile?.firstName ||
        user.profile?.username ||
        auth.username ||
        "System Admin";

  return {
    ...auth,
    profile: user.profile,
    userStatus: user.status,
    username: user.profile?.username || auth.username || null,
    fullName,
    avatarUrl: user.profile?.avatarUrl ?? null,
    role: user.profile?.role || "Quản trị viên",
    login,
    logout,
  };
}
