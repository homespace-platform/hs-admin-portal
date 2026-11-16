import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App.tsx";
import StoreProvider from "./store/StoreProvider.tsx";
import AuthInitializer from "./features/auth/AuthInitializer.tsx";
import { ThemeProvider } from "./components/theme/ThemeProvider.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <StoreProvider>
      <ThemeProvider defaultTheme="light" storageKey="hs-admin-theme">
        <AuthInitializer>
          <BrowserRouter>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </BrowserRouter>
        </AuthInitializer>
      </ThemeProvider>
    </StoreProvider>
  </StrictMode>,
);
