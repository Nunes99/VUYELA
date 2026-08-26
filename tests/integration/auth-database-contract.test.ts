import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/ensure_auth_profiles_and_atomic_business_onboarding.sql"
  ),
  "utf8"
);
const accountSeparationMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/separate_customer_business_accounts.sql"),
  "utf8"
);
const businessTeamMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/support_business_team_accounts.sql"),
  "utf8"
);
const actions = readFileSync(join(process.cwd(), "features/auth/actions.ts"), "utf8");
const forms = readFileSync(join(process.cwd(), "features/auth/forms.tsx"), "utf8");
const callback = readFileSync(join(process.cwd(), "app/(auth)/auth/callback/route.ts"), "utf8");
const consolidatedPolicies = readFileSync(
  join(process.cwd(), "supabase/migrations/consolidate_select_policies.sql"),
  "utf8"
);

describe("authentication database contract", () => {
  it("creates and backfills profiles from Supabase Auth users", () => {
    expect(migration).toContain("create or replace function public.handle_new_auth_user()");
    expect(migration).toContain("after insert on auth.users");
    expect(migration).toContain("from auth.users as users");
    expect(migration).toContain("on conflict (id) do update");
  });

  it("keeps business onboarding in one authenticated database transaction", () => {
    expect(accountSeparationMigration).toContain(
      "account_type in ('customer', 'business', 'platform')"
    );
    expect(accountSeparationMigration).toContain(
      "new.raw_user_meta_data -> 'business_registration'"
    );
    expect(accountSeparationMigration).toContain("insert into public.businesses");
    expect(accountSeparationMigration).toContain("insert into public.branches");
    expect(accountSeparationMigration).toContain("insert into public.business_members");
    expect(accountSeparationMigration).toContain("'business_owner'");
    expect(actions).toContain("signUpBusinessWithEmailAction");
    expect(actions).toContain('account_type: "business"');
    expect(actions).not.toContain("createSupabaseServiceRoleClient");
  });

  it("creates invited team identities without provisioning another business", () => {
    expect(businessTeamMigration).toContain("validate_business_member_invitation");
    expect(businessTeamMigration).toContain("v_registration = '{}'::jsonb");
    expect(businessTeamMigration).toContain("v_profile.account_type <> 'business'");
    expect(actions).toContain("signUpBusinessMemberWithEmailAction");
    expect(actions).toContain('account_type: "business"');
    expect(actions).toContain("validate_business_member_invitation");
  });

  it("validates the NUIT before business onboarding reaches PostgreSQL", () => {
    expect(forms).toContain('pattern="[0-9]{9,12}"');
    expect(forms).toContain("Introduza entre 9 e 12 algarismos");
    expect(actions).toContain("/^\\d{9,12}$/");
    expect(actions).toContain("businesses_nuit_format");
    expect(actions).toContain("Já existe um pedido para este negócio nesta conta");
  });

  it("hardens automatic RLS and prepares relational access paths", () => {
    expect(migration).toContain("revoke all on function public.rls_auto_enable() from anon");
    expect(migration).toContain("alter extension citext set schema extensions");
    expect(migration).toContain("id = (select auth.uid())");
    expect(migration).toContain("transactions_card_business_fk_idx");
    expect(migration).toContain("point_ledger_wallet_card_business_fk_idx");
  });

  it("consolidates overlapping authenticated read policies without losing either scope", () => {
    expect(consolidatedPolicies).toContain("branches_authenticated_select");
    expect(consolidatedPolicies).toContain("business_members_authenticated_select");
    expect(consolidatedPolicies).toContain("customer_cards_authenticated_select");
    expect(consolidatedPolicies).toContain("offers_authenticated_select");
    expect(consolidatedPolicies).toContain("transactions_authenticated_select");
    expect(consolidatedPolicies).toContain("or public.can_access_transaction");
  });

  it("implements password reset completion and handles invalid callback links", () => {
    expect(actions).toContain('encodeURIComponent("/definir-senha")');
    expect(actions).toContain("supabase.auth.updateUser({ password: password.value })");
    expect(callback).toContain("link-invalido");
    expect(callback).toContain("exchangeCodeForSession");
  });
});
