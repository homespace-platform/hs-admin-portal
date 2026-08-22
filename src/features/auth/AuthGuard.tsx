import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import LoadingScreen from "@/components/custom/LoadingScreen";

export default function AuthGuard({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { initialized, authenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return (
      <LoadingScreen
        title="HomeSpace Admin"
        subtitle="Đang kiểm tra quyền quản trị hệ thống..."
      />
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
