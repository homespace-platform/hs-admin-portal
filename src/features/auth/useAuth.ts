import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "@/lib/keycloak";
import { sessionCleared } from "@/features/auth/authSlice";
import { userCleared } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const user = useAppSelector((state) => state.user);

  const login = useCallback(
    () => void keycloak.login({ redirectUri: window.location.origin + "/" }),
    [],
  );

  const logout = useCallback(() => {
    dispatch(sessionCleared());
    dispatch(userCleared());
    navigate("/login");
    void keycloak.logout({ redirectUri: window.location.origin + "/login" });
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
