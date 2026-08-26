export const profileRoles = ["customer", "support_agent", "platform_admin", "super_admin"] as const;

export type ProfileRole = (typeof profileRoles)[number];

export const accountTypes = ["customer", "business", "platform"] as const;

export type AccountType = (typeof accountTypes)[number];

export const businessMemberRoles = [
  "cashier",
  "branch_manager",
  "business_admin",
  "business_owner"
] as const;

export type BusinessMemberRole = (typeof businessMemberRoles)[number];

export type MembershipStatus = "invited" | "active" | "suspended" | "removed";

export type ProtectedRoute = "/cliente" | "/negocio" | "/pos" | "/admin";

export interface BusinessMembership {
  businessId: string;
  branchId: string | null;
  role: BusinessMemberRole;
  status: MembershipStatus;
}

export interface AuthPrincipal {
  profileId: string;
  profileRole: ProfileRole;
  accountType: AccountType;
  mfaVerified: boolean;
  businessMemberships: BusinessMembership[];
}

export interface AccessContext {
  businessId?: string | undefined;
  branchId?: string | undefined;
}

const businessDashboardRoles = new Set<BusinessMemberRole>([
  "branch_manager",
  "business_admin",
  "business_owner"
]);

const businessManagerRoles = new Set<BusinessMemberRole>(["business_admin", "business_owner"]);

const posRoles = new Set<BusinessMemberRole>([
  "cashier",
  "branch_manager",
  "business_admin",
  "business_owner"
]);

const platformRoles = new Set<ProfileRole>(["support_agent", "platform_admin", "super_admin"]);

const mfaRequiredProfileRoles = new Set<ProfileRole>([
  "support_agent",
  "platform_admin",
  "super_admin"
]);

export function isProfileRole(value: string): value is ProfileRole {
  return profileRoles.includes(value as ProfileRole);
}

export function isAccountType(value: string): value is AccountType {
  return accountTypes.includes(value as AccountType);
}

export function isBusinessMemberRole(value: string): value is BusinessMemberRole {
  return businessMemberRoles.includes(value as BusinessMemberRole);
}

export function requiresMfa(profileRole: ProfileRole) {
  return mfaRequiredProfileRoles.has(profileRole);
}

export function isMfaVerifiedAssuranceLevel(level: string | null | undefined) {
  return level === "aal2";
}

export function hasCompletedMfa(principal: AuthPrincipal) {
  return !requiresMfa(principal.profileRole) || principal.mfaVerified;
}

export function hasActiveBusinessMembership(
  principal: AuthPrincipal,
  businessId?: string
): boolean {
  return principal.businessMemberships.some(
    (membership) =>
      membership.status === "active" &&
      (businessId === undefined || membership.businessId === businessId)
  );
}

export function hasActiveBusinessRole(
  principal: AuthPrincipal,
  allowedRoles: ReadonlySet<BusinessMemberRole>,
  businessId?: string
): boolean {
  return principal.businessMemberships.some(
    (membership) =>
      membership.status === "active" &&
      allowedRoles.has(membership.role) &&
      (businessId === undefined || membership.businessId === businessId)
  );
}

export function canAccessBranch(principal: AuthPrincipal, context: AccessContext) {
  if (!context.businessId) {
    return hasActiveBusinessRole(principal, posRoles);
  }

  return principal.businessMemberships.some((membership) => {
    if (membership.status !== "active" || membership.businessId !== context.businessId) {
      return false;
    }

    if (businessManagerRoles.has(membership.role)) {
      return true;
    }

    if (!context.branchId) {
      return membership.role === "branch_manager" || membership.role === "cashier";
    }

    return (
      membership.branchId === context.branchId &&
      (membership.role === "branch_manager" || membership.role === "cashier")
    );
  });
}

export function canAccessRoute(
  principal: AuthPrincipal | null,
  route: ProtectedRoute,
  context: AccessContext = {}
): boolean {
  if (!principal) {
    return false;
  }

  if (!hasCompletedMfa(principal)) {
    return false;
  }

  if (route === "/cliente") {
    return principal.accountType === "customer";
  }

  if (route === "/admin") {
    return platformRoles.has(principal.profileRole);
  }

  if (route === "/negocio") {
    return hasActiveBusinessRole(principal, businessDashboardRoles, context.businessId);
  }

  return canAccessBranch(principal, context);
}

export function canManageBusinessRole(
  actorRole: BusinessMemberRole,
  targetRole: BusinessMemberRole
): boolean {
  if (actorRole === "business_owner") {
    return true;
  }

  if (actorRole === "business_admin") {
    return targetRole !== "business_owner";
  }

  if (actorRole === "branch_manager") {
    return targetRole === "cashier";
  }

  return false;
}

export function getDefaultAuthenticatedPath(principal: AuthPrincipal): ProtectedRoute {
  if (platformRoles.has(principal.profileRole) && hasCompletedMfa(principal)) {
    return "/admin";
  }

  if (
    principal.accountType === "business" &&
    hasActiveBusinessRole(principal, businessDashboardRoles)
  ) {
    return "/negocio";
  }

  if (principal.accountType === "business" && hasActiveBusinessRole(principal, posRoles)) {
    return "/pos";
  }

  return principal.accountType === "customer" ? "/cliente" : "/negocio";
}
