import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { resetPasswordForEmail } = vi.hoisted(() => ({
  resetPasswordForEmail:
    vi.fn<
      (
        email: string,
        options: { redirectTo: string }
      ) => Promise<{ error: { code: string; status: number; message: string } | null }>
    >()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { resetPasswordForEmail } }),
  clearSupabaseAuthCookies: vi.fn()
}));

import { requestPasswordResetAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

function recoveryForm(email = "ana@vuyela.co.mz") {
  const form = new FormData();
  form.set("email", email);
  form.set("portal", "business");
  form.set("next", "/negocio?vista=equipa");
  return form;
}

describe("password recovery requests", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://vuyela.co.mz");
    resetPasswordForEmail.mockReset();
    resetPasswordForEmail.mockResolvedValue({ error: null });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("requests one email with the complete recovery destination", async () => {
    const state = await requestPasswordResetAction(initialAuthActionState, recoveryForm());
    expect(state.status).toBe("success");
    expect(state.message).toContain("Se existir uma conta");
    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1);
    const [email, options] = resetPasswordForEmail.mock.calls[0]!;
    const callback = new URL(options.redirectTo);
    expect(email).toBe("ana@vuyela.co.mz");
    expect(callback.origin).toBe("https://vuyela.co.mz");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("type")).toBe("recovery");
    expect(callback.searchParams.get("next")).toBe(
      "/definir-senha?portal=business&next=%2Fnegocio%3Fvista%3Dequipa"
    );
  });

  it.each(["", "invalid", "a b@vuyela.co.mz", "a@@vuyela.co.mz"])(
    "rejects an invalid email before calling Supabase: %s",
    async (email) => {
      const state = await requestPasswordResetAction(initialAuthActionState, recoveryForm(email));
      expect(state.status).toBe("error");
      expect(resetPasswordForEmail).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["over_email_send_rate_limit", 429, "limite de envio"],
    ["over_request_rate_limit", 429, "demasiados pedidos"],
    ["email_address_not_authorized", 403, "Contacte o suporte"],
    ["email_provider_disabled", 422, "Contacte o suporte"],
    ["email_address_invalid", 422, "e-mail válido"],
    ["unexpected_failure", 500, "temporariamente indisponível"],
    ["unknown", 400, "Tente novamente"]
  ])(
    "explains provider error %s without exposing private details",
    async (code, status, message) => {
      resetPasswordForEmail.mockResolvedValue({
        error: { code, status, message: "Private details: ana@vuyela.co.mz token=secret" }
      });
      const state = await requestPasswordResetAction(initialAuthActionState, recoveryForm());
      expect(state.status).toBe("error");
      expect(state.message).toContain(message);
      expect(console.error).toHaveBeenCalledWith("Password recovery request failed", {
        code,
        status
      });
      expect(JSON.stringify(state)).not.toContain("secret");
    }
  );

  it("handles a transport exception without leaking it or reporting success", async () => {
    resetPasswordForEmail.mockRejectedValue(new Error("Private transport details"));
    const state = await requestPasswordResetAction(initialAuthActionState, recoveryForm());
    expect(state).toEqual({
      status: "error",
      message:
        "Não foi possível contactar o serviço de recuperação. Tente novamente dentro de instantes."
    });
    expect(console.error).toHaveBeenCalledWith("Password recovery request failed", {
      code: "request_failed"
    });
  });

  it("does not send without Supabase configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const state = await requestPasswordResetAction(initialAuthActionState, recoveryForm());
    expect(state.status).toBe("error");
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });
});
