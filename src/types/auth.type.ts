export type AuthSession = {
  authenticated: boolean;
  token?: string;
  refreshToken?: string;
  userId?: string;
  username?: string;
  email?: string;
  roles: string[];
};
