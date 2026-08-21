import "server-only";

import type { AuthPrincipal, BusinessMemberRole, BusinessMembership } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  buildBusinessReferralSummary,
  buildReferralSummary,
  defaultReferralProgramRules,
  getEffectiveReferralStatus,
  isReferralStatus
} from "./model";
import type {
  BusinessReferralSummary,
  CustomerReferralProgram,
  ReferralHistoryItem,
  ReferralProgramRules,
  ReferralStatus,
  ReferralSummary
} from "./model";

interface CustomerCardRow {
  id: string;
  business_id: string;
  card_number: string;
}

interface BusinessRow {
  id: string;
  name: string;
  status: string;
}

interface LoyaltyProgramRow {
  business_id: string;
  point_value_mzn_minor: number;
}

interface ReferralProgramRow {
  id: string;
  business_id: string;
  is_active: boolean;
  qualifying_purchase_minimum_mzn_minor: number;
  referrer_reward_points: number;
  referred_reward_points: number;
  invite_valid_days: number;
  max_open_invites_per_referrer: number;
  reward_limit_count: number;
  reward_limit_period_days: number;
}

interface ReferralRow {
  id: string;
  business_id: string;
  referrer_card_id: string;
  referred_card_id: string | null;
  referral_code: string;
  status: string;
  reward_points: number;
  referred_reward_points: number;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  rewarded_at: string | null;
  blocked_reason: string | null;
}

export interface CustomerReferralsReadyState {
  status: "ready";
  programs: CustomerReferralProgram[];
  referrals: ReferralHistoryItem[];
  summary: ReferralSummary;
}

export type CustomerReferralsState =
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | CustomerReferralsReadyState;

export interface BusinessReferralOption {
  id: string;
  name: string;
}

export interface BusinessReferralsReadyState {
  status: "ready";
  businesses: BusinessReferralOption[];
  selectedBusinessId: string;
  selectedBusinessName: string;
  pointValueMznMinor: number;
  programId: string | null;
  rules: ReferralProgramRules;
  referrals: ReferralHistoryItem[];
  cardNumberById: Record<string, string>;
  summary: BusinessReferralSummary;
}

export type BusinessReferralsState =
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | BusinessReferralsReadyState;

const referralManagerRoles = new Set<BusinessMemberRole>(["business_admin", "business_owner"]);

export async function getCustomerReferrals(profileId: string): Promise<CustomerReferralsState> {
  const supabase = await createSupabaseServerClient();
  const { data: cardData, error: cardError } = await supabase
    .from("customer_cards")
    .select("id, business_id, card_number")
    .eq("customer_profile_id", profileId)
    .eq("status", "active")
    .order("joined_at", { ascending: false });

  if (cardError) {
    return { status: "error", message: "Não foi possível carregar os cartões de indicação." };
  }

  const cards = rowsFrom<CustomerCardRow>(cardData);

  if (cards.length === 0) {
    return {
      status: "empty",
      message: "Adira a um negócio VUYELA para criar ou aceitar indicações."
    };
  }

  const cardIds = cards.map((card) => card.id);
  const businessIds = uniqueValues(cards.map((card) => card.business_id));
  const [businessResult, loyaltyResult, programResult, sentResult, receivedResult] =
    await Promise.all([
      supabase.from("businesses").select("id, name, status").in("id", businessIds),
      supabase
        .from("loyalty_programs")
        .select("business_id, point_value_mzn_minor")
        .in("business_id", businessIds)
        .eq("status", "active"),
      supabase
        .from("referral_programs")
        .select(
          "id, business_id, is_active, qualifying_purchase_minimum_mzn_minor, referrer_reward_points, referred_reward_points, invite_valid_days, max_open_invites_per_referrer, reward_limit_count, reward_limit_period_days"
        )
        .in("business_id", businessIds)
        .eq("is_active", true),
      supabase
        .from("referrals")
        .select(
          "id, business_id, referrer_card_id, referred_card_id, referral_code, status, reward_points, referred_reward_points, created_at, expires_at, accepted_at, rewarded_at, blocked_reason"
        )
        .in("referrer_card_id", cardIds)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("referrals")
        .select(
          "id, business_id, referrer_card_id, referred_card_id, referral_code, status, reward_points, referred_reward_points, created_at, expires_at, accepted_at, rewarded_at, blocked_reason"
        )
        .in("referred_card_id", cardIds)
        .order("created_at", { ascending: false })
        .limit(100)
    ]);

  if (
    businessResult.error ||
    loyaltyResult.error ||
    programResult.error ||
    sentResult.error ||
    receivedResult.error
  ) {
    return { status: "error", message: "Não foi possível carregar as indicações." };
  }

  const businessById = toMap(rowsFrom<BusinessRow>(businessResult.data), (row) => row.id);
  const loyaltyByBusinessId = toMap(
    rowsFrom<LoyaltyProgramRow>(loyaltyResult.data),
    (row) => row.business_id
  );
  const programByBusinessId = toMap(
    rowsFrom<ReferralProgramRow>(programResult.data),
    (row) => row.business_id
  );
  const cardIdSet = new Set(cardIds);
  const programs = cards
    .map((card): CustomerReferralProgram | null => {
      const business = businessById.get(card.business_id);
      const loyalty = loyaltyByBusinessId.get(card.business_id);
      const program = programByBusinessId.get(card.business_id);

      if (!business || business.status !== "active" || !loyalty || !program) {
        return null;
      }

      return {
        id: program.id,
        businessId: card.business_id,
        businessName: business.name,
        cardId: card.id,
        cardNumber: card.card_number,
        pointValueMznMinor: programPointValue(loyalty),
        ...rulesFromRow(program)
      };
    })
    .filter((program): program is CustomerReferralProgram => program !== null);

  const referralRows = uniqueRows([
    ...rowsFrom<ReferralRow>(sentResult.data),
    ...rowsFrom<ReferralRow>(receivedResult.data)
  ]);
  const referrals = referralRows.map((row) =>
    historyFromRow(row, {
      role: cardIdSet.has(row.referrer_card_id) ? "referrer" : "referred",
      businessName: businessById.get(row.business_id)?.name ?? "Negócio VUYELA",
      pointValueMznMinor: loyaltyByBusinessId.get(row.business_id)?.point_value_mzn_minor ?? 0
    })
  );

  return {
    status: "ready",
    programs,
    referrals,
    summary: buildReferralSummary(referrals)
  };
}

export async function getBusinessReferrals(
  principal: AuthPrincipal,
  params: { businessId?: string | undefined } = {}
): Promise<BusinessReferralsState> {
  const memberships = principal.businessMemberships.filter(
    (membership) => membership.status === "active" && referralManagerRoles.has(membership.role)
  );

  if (memberships.length === 0) {
    return {
      status: "empty",
      message: "Indicações podem ser configuradas por administradores ou proprietários do negócio."
    };
  }

  const supabase = await createSupabaseServerClient();
  const businessIds = uniqueValues(memberships.map((membership) => membership.businessId));
  const { data: businessData, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, status")
    .in("id", businessIds)
    .order("name", { ascending: true });

  if (businessError) {
    return { status: "error", message: "Não foi possível carregar os negócios." };
  }

  const businesses = buildBusinessOptions(rowsFrom<BusinessRow>(businessData), memberships);

  if (businesses.length === 0) {
    return { status: "empty", message: "Não há negócios ativos disponíveis." };
  }

  const selectedBusiness =
    businesses.find((business) => business.id === params.businessId) ?? businesses[0];
  const [programResult, loyaltyResult, referralResult, fraudResult] = await Promise.all([
    supabase
      .from("referral_programs")
      .select(
        "id, business_id, is_active, qualifying_purchase_minimum_mzn_minor, referrer_reward_points, referred_reward_points, invite_valid_days, max_open_invites_per_referrer, reward_limit_count, reward_limit_period_days"
      )
      .eq("business_id", selectedBusiness.id)
      .maybeSingle(),
    supabase
      .from("loyalty_programs")
      .select("business_id, point_value_mzn_minor")
      .eq("business_id", selectedBusiness.id)
      .maybeSingle(),
    supabase
      .from("referrals")
      .select(
        "id, business_id, referrer_card_id, referred_card_id, referral_code, status, reward_points, referred_reward_points, created_at, expires_at, accepted_at, rewarded_at, blocked_reason"
      )
      .eq("business_id", selectedBusiness.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("fraud_events")
      .select("id", { count: "exact", head: true })
      .eq("business_id", selectedBusiness.id)
      .like("event_type", "referral_%")
  ]);

  if (programResult.error || loyaltyResult.error || referralResult.error || fraudResult.error) {
    return { status: "error", message: "Não foi possível carregar o programa de indicações." };
  }

  const program = rowFrom<ReferralProgramRow>(programResult.data);
  const loyalty = rowFrom<LoyaltyProgramRow>(loyaltyResult.data);
  const pointValueMznMinor = loyalty?.point_value_mzn_minor ?? 0;
  const referralRows = rowsFrom<ReferralRow>(referralResult.data);
  const cardIds = uniqueValues(
    referralRows.flatMap((row) =>
      row.referred_card_id ? [row.referrer_card_id, row.referred_card_id] : [row.referrer_card_id]
    )
  );
  const { data: cardData, error: cardError } =
    cardIds.length > 0
      ? await supabase.from("customer_cards").select("id, card_number").in("id", cardIds)
      : { data: [], error: null };

  if (cardError) {
    return { status: "error", message: "Não foi possível carregar os cartões indicados." };
  }

  const referrals = referralRows.map((row) =>
    historyFromRow(row, {
      role: "referrer",
      businessName: selectedBusiness.name,
      pointValueMznMinor
    })
  );

  return {
    status: "ready",
    businesses,
    selectedBusinessId: selectedBusiness.id,
    selectedBusinessName: selectedBusiness.name,
    pointValueMznMinor,
    programId: program?.id ?? null,
    rules: program ? rulesFromRow(program) : defaultReferralProgramRules,
    referrals,
    cardNumberById: Object.fromEntries(
      rowsFrom<{ id: string; card_number: string }>(cardData).map((card) => [
        card.id,
        card.card_number
      ])
    ),
    summary: buildBusinessReferralSummary(referrals, fraudResult.count ?? 0)
  };
}

function historyFromRow(
  row: ReferralRow,
  context: {
    role: "referrer" | "referred";
    businessName: string;
    pointValueMznMinor: number;
  }
): ReferralHistoryItem {
  const status: ReferralStatus = isReferralStatus(row.status) ? row.status : "blocked";

  return {
    id: row.id,
    businessId: row.business_id,
    businessName: context.businessName,
    referrerCardId: row.referrer_card_id,
    referredCardId: row.referred_card_id,
    referralCode: row.referral_code,
    status: getEffectiveReferralStatus(status, row.expires_at),
    role: context.role,
    referrerRewardPoints: row.reward_points,
    referredRewardPoints: row.referred_reward_points,
    pointValueMznMinor: context.pointValueMznMinor,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    rewardedAt: row.rewarded_at,
    blockedReason: row.blocked_reason
  };
}

function rulesFromRow(row: ReferralProgramRow): ReferralProgramRules {
  return {
    isActive: row.is_active,
    qualifyingPurchaseMinimumMznMinor: row.qualifying_purchase_minimum_mzn_minor,
    referrerRewardPoints: row.referrer_reward_points,
    referredRewardPoints: row.referred_reward_points,
    inviteValidDays: row.invite_valid_days,
    maxOpenInvitesPerReferrer: row.max_open_invites_per_referrer,
    rewardLimitCount: row.reward_limit_count,
    rewardLimitPeriodDays: row.reward_limit_period_days
  };
}

function buildBusinessOptions(
  businesses: BusinessRow[],
  memberships: BusinessMembership[]
): BusinessReferralOption[] {
  const manageableIds = new Set(memberships.map((membership) => membership.businessId));

  return businesses
    .filter((business) => business.status === "active" && manageableIds.has(business.id))
    .map((business) => ({ id: business.id, name: business.name }));
}

function programPointValue(row: LoyaltyProgramRow): number {
  return Number.isSafeInteger(row.point_value_mzn_minor) ? row.point_value_mzn_minor : 0;
}

function uniqueRows(rows: ReferralRow[]): ReferralRow[] {
  return [...new Map(rows.map((row) => [row.id, row])).values()].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

function rowFrom<T>(row: unknown): T | null {
  return row && typeof row === "object" && !Array.isArray(row) ? (row as T) : null;
}

function rowsFrom<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

function toMap<T>(rows: T[], getKey: (row: T) => string): Map<string, T> {
  return new Map(rows.map((row) => [getKey(row), row]));
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}
