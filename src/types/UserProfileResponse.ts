export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  emailVerified?: boolean | null;
  avatarUrl?: string | null;
  phone?: string | null;
  role?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
