import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  canManageBusinessRole,
  getDefaultAuthenticatedPath,
  requiresMfa
} from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";

const customer: AuthPrincipal = {
  profileId: "customer-1",
  profileRole: "customer",
  mfaVerified: false,
  businessMemberships: []
};

const cashier: AuthPrincipal = {
  profileId: "cashier-1",
  profileRole: "customer",
  mfaVerified: false,
  businessMemberships: [
    {
      businessId: "business-a",
      branchId: "branch-a",
      role: "cashier",
      status: "active"
    }
  ]
};

const businessAdmin: AuthPrincipal = {
  profileId: "admin-1",
  profileRole: "customer",
  mfaVerified: false,
  businessMemberships: [
    {
      businessId: "business-a",
      branchId: null,
      role: "business_admin",
      status: "active"
    }
  ]
};

describe("RBAC", () => {
  it("blocks protected routes for anonymous users", () => {
    expect(canAccessRoute(null, "/cliente")).toBe(false);
    expect(canAccessRoute(null, "/negocio")).toBe(false);
    expect(canAccessRoute(null, "/admin")).toBe(false);
  });

  it("keeps customer accounts out of business and admin routes", () => {
    expect(canAccessRoute(customer, "/cliente")).toBe(true);
    expect(canAccessRoute(customer, "/negocio")).toBe(false);
    expect(canAccessRoute(customer, "/pos")).toBe(false);
    expect(canAccessRoute(customer, "/admin")).toBe(false);
  });

  it("limits cashier POS access to the assigned branch", () => {
    expect(
      canAccessRoute(cashier, "/pos", {
        businessId: "business-a",
        branchId: "branch-a"
      })
    ).toBe(true);
    expect(
      canAccessRoute(cashier, "/pos", {
        businessId: "business-a",
        branchId: "branch-b"
      })
    ).toBe(false);
    expect(
      canAccessRoute(cashier, "/pos", {
        businessId: "business-b",
        branchId: "branch-a"
      })
    ).toBe(false);
  });

  it("prevents business admins from managing owners", () => {
    expect(canManageBusinessRole("business_owner", "business_owner")).toBe(true);
    expect(canManageBusinessRole("business_admin", "cashier")).toBe(true);
    expect(canManageBusinessRole("business_admin", "business_owner")).toBe(false);
    expect(canManageBusinessRole("cashier", "cashier")).toBe(false);
  });

  it("requires MFA-ready checks for privileged platform roles", () => {
    expect(requiresMfa("support_agent")).toBe(true);
    expect(requiresMfa("platform_admin")).toBe(true);
    expect(requiresMfa("super_admin")).toBe(true);
    expect(requiresMfa("customer")).toBe(false);

    expect(
      canAccessRoute(
        {
          profileId: "platform-1",
          profileRole: "platform_admin",
          mfaVerified: false,
          businessMemberships: []
        },
        "/admin"
      )
    ).toBe(false);
  });

  it("resolves the default authenticated landing route by strongest role", () => {
    expect(getDefaultAuthenticatedPath(customer)).toBe("/cliente");
    expect(getDefaultAuthenticatedPath(cashier)).toBe("/pos");
    expect(getDefaultAuthenticatedPath(businessAdmin)).toBe("/negocio");
    expect(
      getDefaultAuthenticatedPath({
        profileId: "platform-1",
        profileRole: "platform_admin",
        mfaVerified: true,
        businessMemberships: []
      })
    ).toBe("/admin");
  });
});
