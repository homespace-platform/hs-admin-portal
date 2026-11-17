/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_BASE_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_GATEWAY_BASE_URL: string;
  readonly VITE_WEB_APP_URL: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_VAPID_KEY: string;
  readonly VITE_ADMIN_QUEUE_ALERTS_ENABLED?: string;
  readonly VITE_ADMIN_QUEUE_POLL_INTERVAL_MS?: string;
  readonly VITE_ADMIN_QUEUE_POPUP_COOLDOWN_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
