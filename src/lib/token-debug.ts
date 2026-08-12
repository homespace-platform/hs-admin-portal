import keycloak from "@/lib/keycloak";

export type TokenSnapshot = {
  authenticated: boolean;
  storage: string;
  accessTokenPreview: string | null;
  refreshTokenPreview: string | null;
  expiresAt: string | null;
  expiresInSeconds: number | null;
  refreshExpiresInSeconds: number | null;
  subject: string | null;
};

export const getTokenSnapshot = (): TokenSnapshot => {
  const exp = keycloak.tokenParsed?.exp;
  const expiresInSeconds =
    typeof exp === "number" ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : null;

  return {
    authenticated: Boolean(keycloak.authenticated),
    storage: "RAM (keycloak-js instance) — không lưu localStorage",
    accessTokenPreview: keycloak.token
      ? `${keycloak.token.slice(0, 24)}...${keycloak.token.slice(-12)}`
      : null,
    refreshTokenPreview: keycloak.refreshToken
      ? `${keycloak.refreshToken.slice(0, 24)}...${keycloak.refreshToken.slice(-12)}`
      : null,
    expiresAt:
      typeof exp === "number"
        ? new Date(exp * 1000).toLocaleTimeString("vi-VN")
        : null,
    expiresInSeconds,
    refreshExpiresInSeconds: keycloak.refreshTokenParsed?.exp
      ? Math.max(
          0,
          keycloak.refreshTokenParsed.exp - Math.floor(Date.now() / 1000),
        )
      : null,
    subject:
      typeof keycloak.tokenParsed?.sub === "string"
        ? keycloak.tokenParsed.sub
        : null,
  };
};
