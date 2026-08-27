import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const posData = readFileSync(join(process.cwd(), "features/pos/data.ts"), "utf8");
const authActions = readFileSync(join(process.cwd(), "features/auth/actions.ts"), "utf8");
const nextConfig = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");
const teamActions = readFileSync(
  join(process.cwd(), "features/business-operations/actions.ts"),
  "utf8"
);

describe("POS application boundary", () => {
  it("loads only business columns granted to authenticated operators", () => {
    expect(posData).toContain('.select("id, name, phone, email")');
    expect(posData).not.toContain('.select("id, name, nuit, phone, email")');
  });

  it("keeps the canonical application under /pos and redirects the old alias", () => {
    expect(nextConfig).toContain('source: "/negocio/pos"');
    expect(nextConfig).toContain('destination: "/pos"');
    expect(nextConfig).not.toContain("async rewrites()");
  });

  it("requires an active POS membership and routes cashier invitations to the POS", () => {
    expect(authActions).toContain('portal === "pos" && isAllowed');
    expect(authActions).toContain('.eq("status", "active")');
    expect(teamActions).toContain('role === "cashier" ? "/pos/convite"');
    expect(teamActions).toContain('membership?.role === "cashier"');
  });
});
