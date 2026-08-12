import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import LoadingScreen from "./components/LoadingScreen.tsx";
import {
  clearAuth,
  setAuthenticatedFromToken,
  setAuthFailure,
} from "./features/auth/authStore";
import { initKeycloakSession } from "./lib/auth-init";
import keycloak from "./lib/keycloak";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

const bootstrap = async () => {
  root.render(
    <LoadingScreen title="HomeSpace" subtitle="Đang khởi tạo phiên đăng nhập..." />,
  );

  try {
    await initKeycloakSession();

    if (keycloak.authenticated) {
      setAuthenticatedFromToken(
        keycloak.tokenParsed as Record<string, unknown> | undefined,
      );
    } else {
      clearAuth();
    }
  } catch (err) {
    console.error("[HomeSpace] Khởi tạo thất bại:", err);
    setAuthFailure();
  } finally {
    root.render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
  }
};

bootstrap();
