import type { AuthState } from "@/features/auth/authSlice";
import type { UserState } from "@/features/user/userSlice";

/**
 * Why the queue is (not) available to the current viewer.
 * - ready: verified ADMIN (backend profile of THIS session identity).
 * - loading: auth/profile not settled yet, or the loaded profile belongs to another identity.
 * - profile-error: the backend profile could not be loaded, so the role is unverified.
 * - forbidden: verified identity whose backend role is not ADMIN (or profile/identity mismatch).
 * - signed-out: no authenticated session.
 */
export type AdminAccess = "ready" | "loading" | "profile-error" | "forbidden" | "signed-out";

/**
 * Same contract as AuthGuard (backend `user.profile.role`, which the gateway also resolves from Core
 * first), but bound to the session: the profile must have been loaded for `auth.userId` and carry that
 * id (backend user id == Keycloak subject). Token `realm_access` roles are NOT consulted: they can be
 * empty for a valid backend ADMIN. Backend /admin APIs still enforce ADMIN on every request.
 */
export function resolveAdminAccess(
  auth: Pick<AuthState, "initialized" | "authenticated" | "userId">,
  user: Pick<UserState, "status" | "profile" | "loadedForUserId">,
): { access: AdminAccess; userId: string | null } {
  const userId = auth.userId?.trim() || null;
  if (!auth.initialized) return { access: "loading", userId: null };
  if (!auth.authenticated || !userId) return { access: "signed-out", userId: null };
  if (user.loadedForUserId !== userId) return { access: "loading", userId };
  if (user.status === "idle" || user.status === "loading") return { access: "loading", userId };
  if (user.status === "failed") return { access: "profile-error", userId };
  const profile = user.profile;
  if (!profile || profile.id !== userId) return { access: "forbidden", userId };
  return {
    access: profile.role?.trim().toUpperCase() === "ADMIN" ? "ready" : "forbidden",
    userId,
  };
}
