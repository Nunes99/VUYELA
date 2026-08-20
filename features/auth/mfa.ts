import type { ProtectedRoute } from "@/lib/auth/rbac";

const mfaDestinationRoutes = new Set<ProtectedRoute>(["/admin"]);

export function getSafeMfaNextPath(next: string | string[] | undefined): ProtectedRoute {
  if (Array.isArray(next) || !next) {
    return "/admin";
  }

  return mfaDestinationRoutes.has(next as ProtectedRoute) ? (next as ProtectedRoute) : "/admin";
}

export function isValidTotpCode(code: string) {
  return /^\d{6}$/.test(code);
}
