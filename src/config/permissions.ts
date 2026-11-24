// Mirrors hs-common-service com.hs.common.security.Permissions (backend is the source of truth).
export const PERMISSIONS = {
  USER_VIEW: "USER_VIEW",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  ROLE_VIEW: "ROLE_VIEW",
  ROLE_UPDATE: "ROLE_UPDATE",
  PERMISSION_VIEW: "PERMISSION_VIEW",
  PERMISSION_UPDATE: "PERMISSION_UPDATE",
  KYC_VIEW: "KYC_VIEW",
  LISTING_VIEW: "LISTING_VIEW",
  LISTING_CREATE: "LISTING_CREATE",
  LISTING_UPDATE: "LISTING_UPDATE",
  LISTING_MODERATE: "LISTING_MODERATE",
  CONTRACT_TEMPLATE_VIEW: "CONTRACT_TEMPLATE_VIEW",
  CONTRACT_TEMPLATE_MANAGE: "CONTRACT_TEMPLATE_MANAGE",
  CONTRACT_TEMPLATE_PUBLISH: "CONTRACT_TEMPLATE_PUBLISH",
  CONTRACT_VIEW: "CONTRACT_VIEW",
  COMPLAINT_VIEW: "COMPLAINT_VIEW",
  COMPLAINT_RESOLVE: "COMPLAINT_RESOLVE",
  NEARBY_SCAN_VIEW: "NEARBY_SCAN_VIEW",
  NEARBY_SCAN_MANAGE: "NEARBY_SCAN_MANAGE",
  NOTIFICATION_BROADCAST: "NOTIFICATION_BROADCAST",
  INCIDENT_VIEW: "INCIDENT_VIEW",
  STORAGE_VIEW: "STORAGE_VIEW",
  // User scope: feature toggles an admin can grant/revoke on the USER role.
  LISTING_POST: "LISTING_POST",
  APPOINTMENT_BOOK: "APPOINTMENT_BOOK",
  APPOINTMENT_MANAGE: "APPOINTMENT_MANAGE",
  RENTAL_REQUEST_CREATE: "RENTAL_REQUEST_CREATE",
  RENTAL_REQUEST_MANAGE: "RENTAL_REQUEST_MANAGE",
  CONTRACT_MANAGE: "CONTRACT_MANAGE",
  CONTRACT_SIGN: "CONTRACT_SIGN",
  COMPLAINT_CREATE: "COMPLAINT_CREATE",
  MEMBERSHIP_PURCHASE: "MEMBERSHIP_PURCHASE",
  FAVORITE_USE: "FAVORITE_USE",
  KYC_SUBMIT: "KYC_SUBMIT",
} as const;

/** Mirrors Permissions.USER_SCOPE; everything else is admin scope and never grantable to USER. */
export const USER_SCOPE_PERMISSIONS: readonly string[] = [
  PERMISSIONS.LISTING_POST, PERMISSIONS.APPOINTMENT_BOOK, PERMISSIONS.APPOINTMENT_MANAGE,
  PERMISSIONS.RENTAL_REQUEST_CREATE, PERMISSIONS.RENTAL_REQUEST_MANAGE, PERMISSIONS.CONTRACT_MANAGE,
  PERMISSIONS.CONTRACT_SIGN, PERMISSIONS.COMPLAINT_CREATE,
  PERMISSIONS.MEMBERSHIP_PURCHASE, PERMISSIONS.FAVORITE_USE, PERMISSIONS.KYC_SUBMIT,
];

export type PermissionScope = "ADMIN" | "USER";

export const isUserScopePermission = (code: string): boolean => USER_SCOPE_PERMISSIONS.includes(code);

/** Backend `scope` when present, else the local USER_SCOPE list. */
export const permissionScope = (permission: { name: string; scope?: PermissionScope | null }): PermissionScope =>
  permission.scope ?? (isUserScopePermission(permission.name) ? "USER" : "ADMIN");

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type PermissionMode = "all" | "any";
export type PermissionRequirement = PermissionCode | readonly PermissionCode[];

export interface PermissionRule {
  permission: PermissionRequirement;
  mode?: PermissionMode;
}

/** Pure check; an empty requirement means "no permission needed". */
export function hasPermission(
  granted: readonly string[],
  required: PermissionRequirement,
  mode: PermissionMode = "all",
): boolean {
  const list: readonly string[] = typeof required === "string" ? [required] : required;
  if (list.length === 0) return true;
  return mode === "any"
    ? list.some((code) => granted.includes(code))
    : list.every((code) => granted.includes(code));
}

/**
 * Single source for route gating, used by the router and the sidebar.
 * Keys are path prefixes (longest match wins); paths with no match need ADMIN only.
 */
export const ROUTE_PERMISSIONS = {
  "/users": { permission: PERMISSIONS.USER_VIEW },
  "/users/roles": { permission: PERMISSIONS.ROLE_VIEW },
  "/users/permissions": { permission: PERMISSIONS.PERMISSION_VIEW },
  "/properties": { permission: PERMISSIONS.LISTING_VIEW },
  "/contracts/templates": { permission: PERMISSIONS.CONTRACT_TEMPLATE_VIEW },
  "/contracts/fields": { permission: PERMISSIONS.CONTRACT_TEMPLATE_VIEW },
  "/contracts/all": { permission: PERMISSIONS.CONTRACT_VIEW },
  "/operations/complaints": { permission: PERMISSIONS.COMPLAINT_VIEW },
  "/operations/notifications": { permission: PERMISSIONS.NOTIFICATION_BROADCAST },
  "/operations/system-alerts": { permission: PERMISSIONS.INCIDENT_VIEW },
} as const satisfies Record<string, PermissionRule>;

export type RouteKey = keyof typeof ROUTE_PERMISSIONS;

export function ruleForPath(pathname: string): PermissionRule | null {
  let best: string | null = null;
  for (const key of Object.keys(ROUTE_PERMISSIONS)) {
    if ((pathname === key || pathname.startsWith(`${key}/`)) && (!best || key.length > best.length)) best = key;
  }
  return best ? ROUTE_PERMISSIONS[best as RouteKey] : null;
}
