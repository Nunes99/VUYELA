import type { ProfileRole } from "@/lib/auth/rbac";

export const adminCapabilities = [
  "platform_metrics_read",
  "businesses_read",
  "businesses_review",
  "users_read",
  "users_manage",
  "subscriptions_read",
  "support_manage",
  "fraud_review",
  "audit_read"
] as const;

export type AdminCapability = (typeof adminCapabilities)[number];

const supportAgentCapabilities = new Set<AdminCapability>([
  "platform_metrics_read",
  "businesses_read",
  "users_read",
  "subscriptions_read",
  "support_manage",
  "fraud_review"
]);

const platformAdminCapabilities = new Set<AdminCapability>(adminCapabilities);

const capabilityMap: Record<ProfileRole, ReadonlySet<AdminCapability>> = {
  customer: new Set<AdminCapability>(),
  support_agent: supportAgentCapabilities,
  platform_admin: platformAdminCapabilities,
  super_admin: platformAdminCapabilities
};

export function hasAdminCapability(role: ProfileRole, capability: AdminCapability): boolean {
  return capabilityMap[role].has(capability);
}

export function getAdminCapabilities(role: ProfileRole): AdminCapability[] {
  return adminCapabilities.filter((capability) => hasAdminCapability(role, capability));
}

export function canAssignProfileRole(actorRole: ProfileRole, targetRole: ProfileRole): boolean {
  if (actorRole === "super_admin") {
    return true;
  }

  return (
    actorRole === "platform_admin" &&
    targetRole !== "platform_admin" &&
    targetRole !== "super_admin"
  );
}

export function canManageProfileRole(actorRole: ProfileRole, currentRole: ProfileRole): boolean {
  if (actorRole === "super_admin") {
    return true;
  }

  return (
    actorRole === "platform_admin" &&
    currentRole !== "platform_admin" &&
    currentRole !== "super_admin"
  );
}
