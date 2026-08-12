import { useAuth } from "@/features/auth/useAuth";
import LoginPage from "@/pages/login";
import LoadingScreen from "@/components/custom/LoadingScreen";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, initialized } = useAuth();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
