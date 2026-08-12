import keycloak from "./keycloak";

export const initKeycloakSession = async () => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Keycloak Timeout")), 10000),
  );

  return Promise.race([
    keycloak.init({
      pkceMethod: "S256",
      checkLoginIframe: false,
      onLoad: "check-sso",
      silentCheckSsoRedirectUri:
        window.location.origin + "/silent-check-sso.html",
    }),
    timeout,
  ]);
};
