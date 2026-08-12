export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  phone?: string;
  role?: string;
  active?: boolean;
}
