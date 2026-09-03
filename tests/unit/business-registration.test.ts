import { describe, expect, it } from "vitest";

import {
  businessSignUpErrorMessage,
  normalizeBusinessPhone
} from "@/features/auth/business-registration";

describe("business registration", () => {
  it.each([
    ["+258 84 123 4567", "+258841234567"],
    ["(+258) 84-123-4567", "+258841234567"],
    ["00258 21 300 400", "+25821300400"],
    ["84 123 4567", "+258841234567"],
    ["25821300400", "+25821300400"]
  ])("normalizes %s before sending it to Auth", (input, expected) => {
    expect(normalizeBusinessPhone(input, "O telefone")).toEqual({
      ok: true,
      value: expected
    });
  });

  it.each(["+258 84 ABC 4567", "123", "+0258841234567", "+258/841234567"])(
    "rejects the invalid contact %s",
    (input) => {
      const result = normalizeBusinessPhone(input, "O telefone");

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toContain("não é válido");
    }
  );

  it("maps stable Auth codes to corrective messages", () => {
    expect(businessSignUpErrorMessage({ code: "weak_password", status: 422 })).toContain(
      "requisitos de segurança"
    );
    expect(businessSignUpErrorMessage({ code: "over_email_send_rate_limit", status: 429 })).toContain(
      "demasiadas tentativas"
    );
    expect(businessSignUpErrorMessage({ code: "user_already_exists", status: 422 })).toContain(
      "Portal de Negócio"
    );
    expect(businessSignUpErrorMessage({ code: "unexpected_failure", status: 500 })).toContain(
      "gravar a conta"
    );
  });
});
