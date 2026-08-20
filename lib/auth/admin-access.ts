import "server-only";

import type { AuthPrincipal } from "@/lib/auth/rbac";
import { requireRouteAccess } from "@/lib/auth/session";

import { hasAdminCapability } from "./admin-permissions";
import type { AdminCapability } from "./admin-permissions";

export class AdminAccessDeniedError extends Error {
  constructor() {
    super("Administrative capability denied");
    this.name = "AdminAccessDeniedError";
  }
}

export function assertAdminCapability(principal: AuthPrincipal, capability: AdminCapability): void {
  if (!hasAdminCapability(principal.profileRole, capability)) {
    throw new AdminAccessDeniedError();
  }
}

export async function requireAdminCapability(
  capability: AdminCapability,
  currentPath = "/admin"
): Promise<AuthPrincipal> {
  const principal = await requireRouteAccess("/admin", currentPath);
  assertAdminCapability(principal, capability);

  return principal;
}
