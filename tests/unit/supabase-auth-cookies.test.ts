import { describe, expect, it } from "vitest";

import { isSupabaseAuthCookieName } from "@/lib/supabase/auth-cookies";

describe("Supabase auth cookie recognition", () => {
  it("recognizes complete and chunked auth cookies", () => {
    expect(isSupabaseAuthCookieName("sb-ytumxecywfxpwlisgvee-auth-token")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-ytumxecywfxpwlisgvee-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-ytumxecywfxpwlisgvee-auth-token.12")).toBe(true);
  });

  it("does not remove unrelated Supabase or application cookies", () => {
    expect(isSupabaseAuthCookieName("sb-ytumxecywfxpwlisgvee-auth-token-code-verifier")).toBe(
      false
    );
    expect(isSupabaseAuthCookieName("vuyela-preference")).toBe(false);
  });
});
