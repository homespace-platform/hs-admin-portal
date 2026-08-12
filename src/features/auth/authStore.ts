export type AuthState = {
  isAuthenticated: boolean;
  initialized: boolean;
  isLoading: boolean;
  email: string | null;
  fullName: string | null;
  username: string | null;
};

type Listener = () => void;

let state: AuthState = {
  isAuthenticated: false,
  initialized: false,
  isLoading: false,
  email: null,
  fullName: null,
  username: null,
};

const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const getAuthState = () => state;

export const subscribeAuth = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setAuthenticatedFromToken = (tokenParsed?: Record<string, unknown>) => {
  state = {
    isAuthenticated: true,
    initialized: true,
    isLoading: false,
    email: typeof tokenParsed?.email === "string" ? tokenParsed.email : null,
    fullName:
      typeof tokenParsed?.name === "string"
        ? tokenParsed.name
        : typeof tokenParsed?.preferred_username === "string"
          ? tokenParsed.preferred_username
          : null,
    username:
      typeof tokenParsed?.preferred_username === "string"
        ? tokenParsed.preferred_username
        : null,
  };
  emit();
};

export const clearAuth = () => {
  state = {
    isAuthenticated: false,
    initialized: true,
    isLoading: false,
    email: null,
    fullName: null,
    username: null,
  };
  emit();
};

export const setAuthFailure = () => {
  state = {
    ...state,
    isAuthenticated: false,
    initialized: true,
    isLoading: false,
  };
  emit();
};

export const setAuthLoading = (isLoading: boolean) => {
  state = { ...state, isLoading };
  emit();
};
