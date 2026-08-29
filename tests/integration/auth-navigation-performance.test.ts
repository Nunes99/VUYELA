import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const middleware = source("middleware.ts");
const session = source("lib/auth/session.ts");
const authActions = source("features/auth/actions.ts");
const protectedRouteView = source("components/auth/protected-route-state.tsx");
const vercelConfig = JSON.parse(source("vercel.json")) as { regions?: string[] };

describe("authentication and navigation performance contract", () => {
  it("refreshes protected application sessions in middleware", () => {
    expect(middleware).toContain("supabase.auth.getClaims()");
    expect(middleware).not.toContain("supabase.auth.getUser()");
    expect(middleware).toContain('"/cliente/:path*"');
    expect(middleware).toContain('"/negocio/:path*"');
    expect(middleware).toContain('"/pos/:path*"');
    expect(middleware).toContain('"/admin/:path*"');
    expect(middleware).toContain('"/conta"');
    expect(middleware).toContain('"Cache-Control", "private, no-store"');
  });

  it("uses verified JWT claims instead of a remote user request during page navigation", () => {
    expect(session).toContain("supabase.auth.getClaims()");
    expect(session).not.toContain("supabase.auth.getUser()");
    expect(session).not.toContain("getAuthenticatorAssuranceLevel");
    expect(session).toContain("cache(async function getAuthContext");
  });

  it("clears stale local cookies before login and does not revoke unrelated sessions", () => {
    expect(authActions).toContain("await clearSupabaseAuthCookies()");
    expect(authActions).toContain('supabase.auth.signOut({ scope: "local" })');
    expect(authActions).not.toContain("supabase.auth.signOut();");
  });

  it("keeps customer notification navigation inside the Next.js router", () => {
    expect(protectedRouteView).toContain('<Link\n                aria-label="Ver notificações"');
    expect(protectedRouteView).not.toContain('<a\n                aria-label="Ver notificações"');
  });

  it("runs dynamic Vercel functions close to the Irish Supabase project", () => {
    expect(vercelConfig.regions).toEqual(["dub1"]);
  });
});
