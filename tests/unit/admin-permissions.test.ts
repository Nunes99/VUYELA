import { describe, expect, it } from "vitest";

import {
  canAssignProfileRole,
  canManageProfileRole,
  getAdminCapabilities,
  hasAdminCapability
} from "@/lib/auth/admin-permissions";

describe("platform administration permissions", () => {
  it("keeps support agents inside support and fraud workflows", () => {
    expect(hasAdminCapability("support_agent", "support_manage")).toBe(true);
    expect(hasAdminCapability("support_agent", "fraud_review")).toBe(true);
    expect(hasAdminCapability("support_agent", "businesses_review")).toBe(false);
    expect(hasAdminCapability("support_agent", "categories_manage")).toBe(false);
    expect(hasAdminCapability("support_agent", "users_manage")).toBe(false);
    expect(hasAdminCapability("support_agent", "subscriptions_manage")).toBe(false);
    expect(hasAdminCapability("support_agent", "audit_read")).toBe(false);
  });

  it("gives platform and super admins the complete capability set", () => {
    expect(getAdminCapabilities("platform_admin")).toHaveLength(11);
    expect(getAdminCapabilities("super_admin")).toHaveLength(11);
    expect(getAdminCapabilities("customer")).toEqual([]);
  });

  it("reserves privileged platform roles for super admins", () => {
    expect(canAssignProfileRole("platform_admin", "support_agent")).toBe(true);
    expect(canAssignProfileRole("platform_admin", "platform_admin")).toBe(false);
    expect(canAssignProfileRole("platform_admin", "super_admin")).toBe(false);
    expect(canManageProfileRole("platform_admin", "support_agent")).toBe(true);
    expect(canManageProfileRole("platform_admin", "platform_admin")).toBe(false);
    expect(canManageProfileRole("super_admin", "super_admin")).toBe(true);
  });
});
