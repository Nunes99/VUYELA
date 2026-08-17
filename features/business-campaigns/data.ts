import "server-only";

import type { AuthPrincipal, BusinessMemberRole, BusinessMembership } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { buildCampaignAnalytics } from "./model";
import type { BusinessCampaign, CampaignAnalytics } from "./model";

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface BusinessCampaignsRpcRow {
  campaigns: unknown;
  analytics: unknown;
}

export interface BusinessCampaignBusinessOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export type BusinessCampaignsState =
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      businesses: BusinessCampaignBusinessOption[];
      selectedBusinessId: string;
      campaigns: BusinessCampaign[];
      analytics: CampaignAnalytics;
    };

const campaignManagerRoles = new Set<BusinessMemberRole>(["business_admin", "business_owner"]);

export async function getBusinessCampaigns(
  principal: AuthPrincipal,
  params: { businessId?: string | undefined } = {}
): Promise<BusinessCampaignsState> {
  const memberships = principal.businessMemberships.filter(
    (membership) => membership.status === "active" && campaignManagerRoles.has(membership.role)
  );

  if (memberships.length === 0) {
    return {
      status: "empty",
      message: "Campanhas podem ser criadas por admins ou owners do negocio."
    };
  }

  const supabase = await createSupabaseServerClient();
  const businessIds = uniqueValues(memberships.map((membership) => membership.businessId));
  const { data: businessData, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, status")
    .in("id", businessIds)
    .order("name", { ascending: true });

  if (businessError) {
    return { status: "error", message: "Nao foi possivel carregar os negocios." };
  }

  const businesses = buildBusinessOptions(rowsFrom<BusinessRow>(businessData), memberships);

  if (businesses.length === 0) {
    return {
      status: "empty",
      message: "Nao ha negocios activos disponiveis para campanhas."
    };
  }

  const selectedBusiness =
    businesses.find((business) => business.id === params.businessId) ?? businesses[0];
  const { data, error } = await supabase.rpc("get_business_campaigns", {
    p_business_id: selectedBusiness.id
  });

  if (error) {
    return { status: "error", message: "Nao foi possivel carregar as campanhas." };
  }

  const row = Array.isArray(data) ? (data[0] as BusinessCampaignsRpcRow | undefined) : undefined;
  const campaigns = arrayFrom<BusinessCampaign>(row?.campaigns).filter(isBusinessCampaign);
  const analytics =
    objectFrom<CampaignAnalytics>(row?.analytics) ?? buildCampaignAnalytics(campaigns);

  return {
    status: "ready",
    businesses,
    selectedBusinessId: selectedBusiness.id,
    campaigns,
    analytics
  };
}

function buildBusinessOptions(
  businesses: BusinessRow[],
  memberships: BusinessMembership[]
): BusinessCampaignBusinessOption[] {
  const manageableBusinessIds = new Set(memberships.map((membership) => membership.businessId));

  return businesses
    .filter((business) => manageableBusinessIds.has(business.id))
    .map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status
    }));
}

function isBusinessCampaign(value: BusinessCampaign): boolean {
  return typeof value.id === "string" && typeof value.name === "string";
}

function rowsFrom<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

function arrayFrom<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function objectFrom<T>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : null;
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}
