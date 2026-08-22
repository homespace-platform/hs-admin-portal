import React, { useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import LoadingScreen from "@/components/custom/LoadingScreen";
import AccessWarningScreen from "./AccessWarningScreen";
import { sessionCleared } from "@/features/auth/authSlice";
import { userCleared } from "@/features/user/userSlice";
import keycloak from "@/lib/keycloak";

interface AuthGuardProps {
  children?: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const dispatch = useAppDispatch();
  const { initialized, authenticated } = useAppSelector((state) => state.auth);
  const { profile, status } = useAppSelector((state) => state.user);
  const location = useLocation();

  const handleForceLogout = useCallback(() => {
    dispatch(sessionCleared());
    dispatch(userCleared());
    keycloak.logout({ redirectUri: window.location.origin + "/login" });
  }, [dispatch]);

  // 1. Session initialization
  if (!initialized) {
    return (
      <LoadingScreen
        title="HomeSpace Admin"
        subtitle="Đang kiểm tra quyền quản trị hệ thống..."
      />
    );
  }

  // 2. Not authenticated -> Redirect to /login
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Waiting for user profile & role verification
  if (status === "loading" || status === "idle") {
    return (
      <LoadingScreen
        title="HomeSpace Admin"
        subtitle="Đang xác thực quyền hạn quản trị viên..."
      />
    );
  }

  // 4. Role mismatch -> Show Warning Screen with 10s Countdown and Auto-Logout
  const isAdmin = profile?.role?.toUpperCase() === "ADMIN";

  if (!isAdmin && profile) {
    return (
      <AccessWarningScreen
        profile={profile}
        onLogout={handleForceLogout}
        initialCountdown={10}
      />
    );
  }

  return <>{children}</>;
}
