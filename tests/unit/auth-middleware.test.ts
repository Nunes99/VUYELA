// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getClaims } = vi.hoisted(() => ({ getClaims: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims } })
}));

import { config, middleware } from "@/middleware";

describe("protected route middleware", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    getClaims.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("refreshes the customer onboarding session before server rendering", async () => {
    expect(config.matcher).toContain("/onboarding/cliente");
    getClaims.mockResolvedValue({ data: { claims: { sub: "customer-id" } }, error: null });
    const response = await middleware(new NextRequest("https://vuyela.test/onboarding/cliente"));
    expect(getClaims).toHaveBeenCalledOnce();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it.each(["/cliente/entrar", "/negocio/entrar", "/pos/entrar", "/admin/entrar"])(
    "keeps the public sign-in route accessible: %s",
    async (path) => {
      const response = await middleware(new NextRequest(`https://vuyela.test${path}`));
      expect(response.status).toBe(200);
      expect(getClaims).not.toHaveBeenCalled();
    }
  );

  it("expires stale chunked cookies while retaining the page authorization boundary", async () => {
    getClaims.mockResolvedValue({ data: null, error: { code: "refresh_token_not_found" } });
    const response = await middleware(
      new NextRequest("https://vuyela.test/cliente", {
        headers: { cookie: "sb-project-auth-token.0=expired; preference=keep" }
      })
    );
    expect(response.cookies.get("sb-project-auth-token.0")?.maxAge).toBe(0);
    expect(response.cookies.get("preference")).toBeUndefined();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("redirects an unauthenticated account request to sign-in with its destination", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    const response = await middleware(new NextRequest("https://vuyela.test/conta?source=menu"));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/entrar");
    expect(location.searchParams.get("next")).toBe("/conta?source=menu");
  });
});
