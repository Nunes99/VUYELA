import "server-only";

import type { AuthPrincipal, BusinessMemberRole, BusinessMembership } from "@/lib/auth/rbac";
import { isNotificationEmailConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseBusinessSubscriptionOverview } from "@/features/subscriptions/model";

import { buildCampaignAnalytics } from "./model";
import type { BusinessCampaign, BusinessOffer, CampaignAnalytics } from "./model";

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

interface OfferRow {
  id: string;
  campaign_id: string | null;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_public: boolean;
  is_active: boolean;
}

interface OfferClaimRow {
  offer_id: string;
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
      offers: BusinessOffer[];
      analytics: CampaignAnalytics;
      emailDeliveryConfigured: boolean;
      campaignLimit: number | null;
      campaignUsage: number;
      canCreateCampaign: boolean;
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
      message: "Campanhas podem ser criadas por administradores ou proprietários do negócio."
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
    return { status: "error", message: "Não foi possível carregar os negócios." };
  }

  const businesses = buildBusinessOptions(rowsFrom<BusinessRow>(businessData), memberships);

  if (businesses.length === 0) {
    return {
      status: "empty",
      message: "Não há negócios ativos disponíveis para campanhas."
    };
  }

  const selectedBusiness =
    businesses.find((business) => business.id === params.businessId) ?? businesses[0];
  const [campaignResult, subscriptionResult, offersResult, claimsResult] = await Promise.all([
    supabase.rpc("get_business_campaigns", {
      p_business_id: selectedBusiness.id
    }),
    supabase.rpc("get_business_subscription_overview", {
      p_business_id: selectedBusiness.id
    }),
    supabase
      .from("offers")
      .select(
        "id, campaign_id, slug, title, description, image_url, starts_at, ends_at, is_public, is_active"
      )
      .eq("business_id", selectedBusiness.id)
      .order("created_at", { ascending: false }),
    supabase.from("offer_claims").select("offer_id").eq("business_id", selectedBusiness.id)
  ]);

  if (
    campaignResult.error ||
    subscriptionResult.error ||
    offersResult.error ||
    claimsResult.error
  ) {
    return { status: "error", message: "Não foi possível carregar as campanhas." };
  }

  const row = Array.isArray(campaignResult.data)
    ? (campaignResult.data[0] as BusinessCampaignsRpcRow | undefined)
    : undefined;
  const campaigns = arrayFrom<BusinessCampaign>(row?.campaigns).filter(isBusinessCampaign);
  const claimCounts = countClaims(rowsFrom<OfferClaimRow>(claimsResult.data));
  const offers = rowsFrom<OfferRow>(offersResult.data).map((offer) => ({
    id: offer.id,
    campaignId: offer.campaign_id,
    slug: offer.slug,
    title: offer.title,
    description: offer.description,
    imageUrl: offer.image_url,
    startsAt: offer.starts_at,
    endsAt: offer.ends_at,
    isPublic: offer.is_public,
    isActive: offer.is_active,
    claimCount: claimCounts.get(offer.id) ?? 0
  }));
  const analytics =
    objectFrom<CampaignAnalytics>(row?.analytics) ?? buildCampaignAnalytics(campaigns);
  const subscription = parseBusinessSubscriptionOverview(subscriptionResult.data);

  if (!subscription?.entitlements) {
    return { status: "error", message: "O plano do negócio não está configurado." };
  }

  const campaignLimit = subscription.entitlements.campaignLimit;
  const campaignUsage = subscription.usage.campaigns;

  return {
    status: "ready",
    businesses,
    selectedBusinessId: selectedBusiness.id,
    campaigns,
    offers,
    analytics,
    emailDeliveryConfigured: isNotificationEmailConfigured(),
    campaignLimit,
    campaignUsage,
    canCreateCampaign: campaignLimit === null || campaignUsage < campaignLimit
  };
}

function countClaims(rows: OfferClaimRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.offer_id, (counts.get(row.offer_id) ?? 0) + 1);
  return counts;
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
