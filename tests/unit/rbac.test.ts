import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  canManageBusinessRole,
  getDefaultAuthenticatedPath,
  isMfaVerifiedAssuranceLevel,
  requiresMfa
} from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";

const customer: AuthPrincipal = {
  profileId: "customer-1",
  profileRole: "customer",
  accountType: "customer",
  mfaVerified: false,
  businessMemberships: []
};

const cashier: AuthPrincipal = {
  profileId: "cashier-1",
  profileRole: "customer",
  accountType: "business",
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
  accountType: "business",
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
    expect(canAccessRoute(cashier, "/cliente")).toBe(false);
    expect(canAccessRoute(cashier, "/negocio")).toBe(false);
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

  it("keeps business identities out of the customer portal", () => {
    expect(canAccessRoute(businessAdmin, "/cliente")).toBe(false);
    expect(canAccessRoute(businessAdmin, "/negocio")).toBe(true);
  });

  it("prevents business admins from managing owners", () => {
    expect(canManageBusinessRole("business_owner", "business_owner")).toBe(true);
    expect(canManageBusinessRole("business_admin", "cashier")).toBe(true);
    expect(canManageBusinessRole("business_admin", "business_owner")).toBe(false);
    expect(canManageBusinessRole("cashier", "cashier")).toBe(false);
  });

  it("requires MFA checks for privileged platform roles", () => {
    expect(requiresMfa("support_agent")).toBe(true);
    expect(requiresMfa("platform_admin")).toBe(true);
    expect(requiresMfa("super_admin")).toBe(true);
    expect(requiresMfa("customer")).toBe(false);

    expect(
      canAccessRoute(
        {
          profileId: "platform-1",
          profileRole: "platform_admin",
          accountType: "platform",
          mfaVerified: false,
          businessMemberships: []
        },
        "/admin"
      )
    ).toBe(false);
  });

  it("accepts only a real aal2 session as completed MFA", () => {
    expect(isMfaVerifiedAssuranceLevel("aal2")).toBe(true);
    expect(isMfaVerifiedAssuranceLevel("aal1")).toBe(false);
    expect(isMfaVerifiedAssuranceLevel(null)).toBe(false);
  });

  it("resolves the default authenticated landing route by strongest role", () => {
    expect(getDefaultAuthenticatedPath(customer)).toBe("/cliente");
    expect(getDefaultAuthenticatedPath(cashier)).toBe("/pos");
    expect(getDefaultAuthenticatedPath(businessAdmin)).toBe("/negocio");
    expect(
      getDefaultAuthenticatedPath({
        profileId: "platform-1",
        profileRole: "platform_admin",
        accountType: "platform",
        mfaVerified: true,
        businessMemberships: []
      })
    ).toBe("/admin");
  });
});
