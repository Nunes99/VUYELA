import { describe, expect, it } from "vitest";

import { getSafeMfaNextPath, isValidTotpCode } from "@/features/auth/mfa";

describe("MFA", () => {
  it("keeps the post-verification destination restricted to admin", () => {
    expect(getSafeMfaNextPath("/admin")).toBe("/admin");
    expect(getSafeMfaNextPath("//attacker.example")).toBe("/admin");
    expect(getSafeMfaNextPath("https://attacker.example")).toBe("/admin");
    expect(getSafeMfaNextPath(["/admin"])).toBe("/admin");
  });

  it("accepts only six digit TOTP codes", () => {
    expect(isValidTotpCode("123456")).toBe(true);
    expect(isValidTotpCode("12345")).toBe(false);
    expect(isValidTotpCode("1234567")).toBe(false);
    expect(isValidTotpCode("12a456")).toBe(false);
  });
});
