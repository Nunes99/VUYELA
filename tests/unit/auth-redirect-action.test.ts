import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({
  clearSupabaseAuthCookies: vi.fn(),
  createSupabaseServerClient: async () => ({
    auth: {
      signInWithPassword: async () => ({ data: { user: { id: "test-user" } }, error: null })
    }
  })
}));

import { signInWithEmailAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

describe("post-login redirects", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
    redirect.mockReset();
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    "//outside.example",
    "/\\outside.example",
    "/\t/outside.example",
    "https://outside.example"
  ])("rejects an external or browser-normalized destination: %s", async (next) => {
    const form = new FormData();
    form.set("email", "ana@vuyela.co.mz");
    form.set("password", "test-password");
    form.set("next", next);
    await expect(signInWithEmailAction(initialAuthActionState, form)).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/conta");
  });

  it("preserves internal navigation", async () => {
    const form = new FormData();
    form.set("email", "ana@vuyela.co.mz");
    form.set("password", "test-password");
    form.set("next", "/cliente?tab=ofertas");
    await expect(signInWithEmailAction(initialAuthActionState, form)).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/cliente?tab=ofertas");
  });
});
