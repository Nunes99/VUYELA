// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth }))
}));

import { GET } from "@/app/(auth)/auth/callback/route";
import { middleware } from "@/middleware";

describe("authentication callback", () => {
  it("rescues recovery codes redirected to the site root", async () => {
    const response = await middleware(new NextRequest("https://vuyela.example/?code=valid"));
    const target = new URL(response.headers.get("location")!);
    expect(target.pathname).toBe("/auth/callback");
    expect(target.searchParams.get("code")).toBe("valid");
    expect(target.searchParams.get("next")).toBe("/definir-senha");
    expect(target.searchParams.get("type")).toBe("recovery");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("leaves normal homepage navigation unchanged", async () => {
    const response = await middleware(new NextRequest("https://vuyela.example/?utm_source=email"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    auth.verifyOtp.mockResolvedValue({ error: null });
  });

  it("exchanges a PKCE code and preserves the portal recovery destination", async () => {
    const next = "/definir-senha?portal=pos&next=%2Fpos";
    const response = await GET(
      new Request(
        `https://vuyela.example/auth/callback?code=valid&type=recovery&next=${encodeURIComponent(next)}`
      )
    );
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(response.headers.get("location")).toBe(`https://vuyela.example${next}`);
  });

  it("verifies a recovery token without a browser PKCE verifier", async () => {
    const response = await GET(
      new Request("https://vuyela.example/auth/callback?token_hash=valid&type=recovery")
    );
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "valid", type: "recovery" });
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://vuyela.example/definir-senha");
  });

  it.each(["//outside.example", "/\\outside.example", "/cliente"])(
    "keeps recovery on the password page for destination %s",
    async (next) => {
      const response = await GET(
        new Request(
          `https://vuyela.example/auth/callback?token_hash=valid&type=recovery&next=${encodeURIComponent(next)}`
        )
      );
      expect(response.headers.get("location")).toBe("https://vuyela.example/definir-senha");
    }
  );

  it("rejects expired recovery tokens", async () => {
    auth.verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    const response = await GET(
      new Request("https://vuyela.example/auth/callback?token_hash=expired&type=recovery")
    );
    expect(response.headers.get("location")).toBe(
      "https://vuyela.example/entrar?erro=link-invalido"
    );
  });

  it("does not treat other token types as recovery", async () => {
    const response = await GET(
      new Request("https://vuyela.example/auth/callback?token_hash=valid&type=signup")
    );
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("erro=link-invalido");
  });
});
