import React, { useEffect } from "react";
import keycloak from "@/lib/keycloak";
import {
  initKeycloakSession,
  readKeycloakSession,
} from "@/features/auth/authSession";
import { useAppDispatch } from "@/store/hooks";
import { sessionCleared, sessionInitialized } from "@/features/auth/authSlice";
import { fetchCurrentUser, userCleared } from "@/features/user/userSlice";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;

    const clearSession = () => {
      if (!active) return;
      dispatch(sessionCleared());
      dispatch(userCleared());
    };

    const refreshExpiredToken = () => {
      void keycloak.updateToken(30).catch(clearSession);
    };

    keycloak.onAuthLogout = clearSession;
    keycloak.onAuthRefreshError = clearSession;
    keycloak.onTokenExpired = refreshExpiredToken;
    window.addEventListener("hs:auth-session-expired", clearSession);

    initKeycloakSession()
      .then(() => {
        const session = readKeycloakSession();
        if (!active) return;

        dispatch(sessionInitialized(session));
        if (session.authenticated && session.userId) {
          dispatch(fetchCurrentUser({ userId: session.userId }))
            .unwrap()
            .then((profile) => {
              if (!active) return;
              if (profile?.role?.toUpperCase() !== "ADMIN") {
                console.warn(
                  `[Security Notice] User @${profile?.username} logged in with non-admin role [${profile?.role}]. AuthGuard will handle the 10s countdown warning and logout.`,
                );
              }
            })
            .catch((error) => {
              console.error("[hs-admin-portal] Fetch user profile failed:", error);
            });
        } else {
          dispatch(userCleared());
        }
      })
      .catch((error) => {
        console.error("[hs-admin-portal] Keycloak init failed:", error);
        if (active) {
          dispatch(sessionCleared());
          dispatch(userCleared());
        }
      });

    return () => {
      active = false;
      keycloak.onAuthLogout = undefined;
      keycloak.onAuthRefreshError = undefined;
      keycloak.onTokenExpired = undefined;
      window.removeEventListener("hs:auth-session-expired", clearSession);
    };
  }, [dispatch]);

  return <>{children}</>;
}
