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
const operatorMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/provision_pos_operator_credentials.sql"),
  "utf8"
);
const operatorHardeningMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/harden_pos_operator_provisioning.sql"),
  "utf8"
);
const operatorForm = readFileSync(
  join(process.cwd(), "features/business-operations/pos-operator-form.tsx"),
  "utf8"
);
const posSignIn = readFileSync(join(process.cwd(), "features/auth/portal-sign-in.tsx"), "utf8");

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

  it("provisions unique POS-only credentials from an authorized business session", () => {
    expect(teamActions).toContain("adminSupabase.auth.admin.createUser");
    expect(teamActions).toContain("email_confirm: true");
    expect(teamActions).toContain('account_type: "business"');
    expect(teamActions).toContain('adminSupabase.rpc("provision_business_pos_operator"');
    expect(teamActions).toContain("p_actor_profile_id: principal.profileId");
    expect(teamActions).toContain("adminSupabase.auth.admin.deleteUser");
    expect(operatorMigration).toContain("credentialsStored");
    expect(operatorHardeningMigration).toContain("profile_id = p_actor_profile_id");
    expect(operatorHardeningMigration).toContain("role in ('business_admin', 'business_owner')");
    expect(operatorHardeningMigration).toContain("and business_id = p_business_id");
    expect(operatorHardeningMigration).toContain("and is_active");
    expect(operatorHardeningMigration).toContain("'cashier'");
    expect(operatorHardeningMigration).toContain("security invoker");
    expect(operatorHardeningMigration).toContain("from public, anon, authenticated");
    expect(operatorHardeningMigration).toContain("to service_role");
    expect(teamActions).toContain("a palavra-passe não volta a ser apresentada");
    expect(operatorForm).toContain('label="Palavra-passe temporária"');
  });

  it("offers installation from the dedicated POS entry point", () => {
    expect(posSignIn).toContain('<PwaInstallAction area="pos" />');
    expect(posSignIn).toContain("credenciais individuais ou um");
  });
});
