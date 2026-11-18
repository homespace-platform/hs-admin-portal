export type UserAddress = import("@/services/vietmap.service").VietmapAddress & { id: string; createdAt?: string | null; updatedAt?: string | null };

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  avatarStorageId?: string | null;
  phone?: string | null;
  cccd?: string | null;
  roleId?: string | null;
  role?: string | null;
  onBoarded?: boolean | null;
  active?: boolean | null;
  kycVerified?: boolean | null;
  kycOptional?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  address?: UserAddress | null;
};

export type UpsertUserAddressRequest = { refId: string; addressNote?: string };

export type OnboardingStatusResponse = {
  completed: boolean;
  version: number;
  requiredSteps: string[];
  completedSteps: string[];
  nextStep: "PROFILE" | "ADDRESS" | "PASSWORD" | "BANK_ACCOUNT" | "COMPLETED";
  passwordSet?: boolean;
  missingRequirements?: Array<"PROFILE" | "ADDRESS" | "BANK_ACCOUNT" | "KYC">;
  serviceReady?: boolean;
};

export type UserAuditActor = {
  id: string;
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type AdminUser = UserProfile & {
  createdBy?: UserAuditActor | string | null;
  updatedBy?: UserAuditActor | string | null;
};

export type CreateAdminUserRequest = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  enabled?: boolean;
  sendInvitation?: boolean;
};

export type UpdateAdminUserRequest = {
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roleId?: string | null;
};

export type UpdateUserProfileRequest = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export type UpdatePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

export type UpdateUserAvatarRequest = {
  storageId: string;
};

export type OnboardingRequest = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

export type SetInitialPasswordRequest = {
  newPassword: string;
};
