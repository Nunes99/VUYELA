import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/create_campaign_management.sql"),
  "utf8"
);
const action = readFileSync(join(process.cwd(), "features/business-campaigns/actions.ts"), "utf8");
const page = readFileSync(join(process.cwd(), "app/negocio/campanhas/page.tsx"), "utf8");

describe("business campaigns contract", () => {
  it("adds a security-definer campaign creation and eligibility boundary", () => {
    expect(migration).toContain("create or replace function public.calculate_campaign_eligibility");
    expect(migration).toContain("create or replace function public.create_campaign_with_audience");
    expect(migration).toContain("create or replace function public.get_business_campaigns");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("public.can_manage_business(p_business_id)");
    expect(migration).toContain("grant execute on function public.create_campaign_with_audience");
  });

  it("supports scheduled windows, rule objects, and materialized audience rows", () => {
    expect(migration).toContain("campaigns_rules_object");
    expect(migration).toContain("campaigns_audience_object");
    expect(migration).toContain("p_starts_at timestamptz");
    expect(migration).toContain("p_ends_at timestamptz");
    expect(migration).toContain("v_status := 'scheduled'");
    expect(migration).toContain("insert into public.campaign_audiences");
    expect(migration).toContain("campaign_audiences_campaign_card_unique_idx");
  });

  it("calculates consent-aware eligibility without sending communications", () => {
    expect(migration).toContain("marketing_consent_at is not null");
    expect(migration).toContain("requiresMarketingConsent");
    expect(migration).toContain("not v_requires_consent or cm.has_marketing_consent");
    expect(migration).not.toMatch(/insert into public\.notifications/i);
  });

  it("does not mutate loyalty balances or ledger records", () => {
    expect(migration).not.toMatch(/update public\.point_wallets/i);
    expect(migration).not.toMatch(/insert into public\.point_ledger/i);
    expect(migration).not.toMatch(/insert into public\.transactions/i);
  });

  it("keeps the campaign page protected and mutations server-side", () => {
    expect(page).toContain('getProtectedRouteState("/negocio", "/negocio/campanhas")');
    expect(page).toContain("robots");
    expect(action).toContain('"use server"');
    expect(action).toContain('requireRouteAccess("/negocio", "/negocio/campanhas")');
    expect(action).toContain("create_campaign_with_audience");
  });
});
