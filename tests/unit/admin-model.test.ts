import { describe, expect, it } from "vitest";

import {
  describeAuditChange,
  normalizeAdminQuery,
  parseAdminView,
  summarizeJson
} from "@/features/admin/model";

describe("admin view model", () => {
  it("accepts only known views and bounded search input", () => {
    expect(parseAdminView("fraud")).toBe("fraud");
    expect(parseAdminView("categories")).toBe("categories");
    expect(parseAdminView("unknown")).toBe("overview");
    expect(parseAdminView(["support", "audit"])).toBe("support");
    expect(normalizeAdminQuery(`  ${"a".repeat(100)}  `)).toHaveLength(80);
  });

  it("summarizes operational JSON without rendering unbounded payloads", () => {
    expect(summarizeJson({})).toBe("Sem detalhes");
    expect(summarizeJson({ reason: "duplicate" })).toContain("duplicate");
    expect(summarizeJson({ value: "x".repeat(400) })).toHaveLength(183);
  });

  it("describes changed audit fields", () => {
    expect(describeAuditChange({ status: "draft" }, { status: "active" })).toContain(
      "status: draft -> active"
    );
    expect(describeAuditChange(null, null)).toBe("Registo criado ou atualizado");
  });
});
