import { useSyncExternalStore } from "react";
import { getAuthState, subscribeAuth } from "./authStore";

export const useAuth = () => {
  const auth = useSyncExternalStore(subscribeAuth, getAuthState, getAuthState);

  return {
    ...auth,
    isLoading: auth.isLoading || !auth.initialized,
  };
};
