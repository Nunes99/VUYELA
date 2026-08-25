import { describe, expect, it } from "vitest";

import {
  getBusinessMemberRoleLabel,
  getMembershipStatusLabel,
  isCatalogItemKind,
  isManageableBusinessMemberRole
} from "@/features/business-operations/model";

describe("business operations model", () => {
  it("accepts only roles that can be assigned through an invitation", () => {
    expect(isManageableBusinessMemberRole("cashier")).toBe(true);
    expect(isManageableBusinessMemberRole("branch_manager")).toBe(true);
    expect(isManageableBusinessMemberRole("business_admin")).toBe(true);
    expect(isManageableBusinessMemberRole("business_owner")).toBe(false);
  });

  it("validates catalog kinds and presents Portuguese labels", () => {
    expect(isCatalogItemKind("service")).toBe(true);
    expect(isCatalogItemKind("product")).toBe(true);
    expect(isCatalogItemKind("bundle")).toBe(false);
    expect(getBusinessMemberRoleLabel("branch_manager")).toBe("Gestor de filial");
    expect(getMembershipStatusLabel("suspended")).toBe("Suspenso");
  });
});
