const KNOWN_ROLES = ["ADMIN", "STAFF"] as const;

export function normalizeRole(role: string | null | undefined): string {
  const normalized = (role ?? "")
    .replace(/^ROLE_/, "")
    .trim()
    .toUpperCase();

  return KNOWN_ROLES.find((knownRole) => knownRole === normalized) ?? "";
}

export function canAccessRole(
  role: string | null | undefined,
  allowedRoles: string[],
): boolean {
  const normalizedRole = normalizeRole(role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return normalizedRole !== "" && normalizedAllowedRoles.includes(normalizedRole);
}
