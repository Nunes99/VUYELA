import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { buildDigitalCustomerCard } from "./model";
import type {
  CardStatus,
  CustomerCardSource,
  CustomerCardTier,
  DigitalCustomerCard
} from "./model";

interface CustomerCardRow {
  id: string;
  business_id: string;
  customer_profile_id: string;
  loyalty_program_id: string;
  card_number: string;
  status: string;
  display_name: string | null;
  joined_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
}

interface BusinessRow {
  id: string;
  name: string;
  logo_url: string | null;
}

interface LoyaltyProgramRow {
  id: string;
  point_value_mzn_minor: number;
  points_expire_after_days: number | null;
}

interface PointWalletRow {
  customer_card_id: string;
  available_balance: number;
  lifetime_earned: number;
}

interface LoyaltyTierRow {
  id: string;
  loyalty_program_id: string;
  name: string;
  minimum_lifetime_points: number;
  sort_order: number;
}

export type CustomerCardsState =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "populated"; cards: DigitalCustomerCard[] };

export async function getCustomerCards(profileId: string): Promise<CustomerCardsState> {
  const supabase = await createSupabaseServerClient();
  const { data: cardData, error: cardError } = await supabase
    .from("customer_cards")
    .select(
      "id, business_id, customer_profile_id, loyalty_program_id, card_number, status, display_name, joined_at"
    )
    .eq("customer_profile_id", profileId)
    .order("joined_at", { ascending: false });

  if (cardError) {
    return { status: "error", message: "Nao foi possivel carregar os seus cartoes." };
  }

  const cardRows = rowsFrom<CustomerCardRow>(cardData).filter(isRenderableCardRow);

  if (cardRows.length === 0) {
    return { status: "empty" };
  }

  const businessIds = uniqueValues(cardRows.map((card) => card.business_id));
  const programIds = uniqueValues(cardRows.map((card) => card.loyalty_program_id));
  const cardIds = uniqueValues(cardRows.map((card) => card.id));

  const [
    { data: profileData, error: profileError },
    { data: businessData, error: businessError },
    { data: programData, error: programError },
    { data: walletData, error: walletError },
    { data: tierData, error: tierError }
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, phone")
      .eq("id", profileId)
      .maybeSingle(),
    supabase.from("businesses").select("id, name, logo_url").in("id", businessIds),
    supabase
      .from("loyalty_programs")
      .select("id, point_value_mzn_minor, points_expire_after_days")
      .in("id", programIds),
    supabase
      .from("point_wallets")
      .select("customer_card_id, available_balance, lifetime_earned")
      .in("customer_card_id", cardIds),
    supabase
      .from("loyalty_tiers")
      .select("id, loyalty_program_id, name, minimum_lifetime_points, sort_order")
      .in("loyalty_program_id", programIds)
      .order("minimum_lifetime_points", { ascending: true })
  ]);

  if (profileError || businessError || programError || walletError || tierError) {
    return { status: "error", message: "Nao foi possivel montar os dados dos cartoes." };
  }

  const profile = rowFrom<ProfileRow>(profileData);
  const customerName = getCustomerName(profile);
  const businessById = toMap(rowsFrom<BusinessRow>(businessData), (business) => business.id);
  const programById = toMap(rowsFrom<LoyaltyProgramRow>(programData), (program) => program.id);
  const walletByCardId = toMap(
    rowsFrom<PointWalletRow>(walletData),
    (wallet) => wallet.customer_card_id
  );
  const tiersByProgramId = groupTiersByProgramId(rowsFrom<LoyaltyTierRow>(tierData));

  const cards = cardRows
    .map((card): DigitalCustomerCard | null => {
      const business = businessById.get(card.business_id);
      const program = programById.get(card.loyalty_program_id);
      const wallet = walletByCardId.get(card.id);

      if (!business || !program || !wallet) {
        return null;
      }

      const source: CustomerCardSource = {
        id: card.id,
        businessId: card.business_id,
        businessName: business.name,
        businessLogoUrl: business.logo_url,
        customerName: card.display_name?.trim() || customerName,
        cardNumber: card.card_number,
        status: card.status,
        joinedAt: card.joined_at,
        availablePoints: wallet.available_balance,
        lifetimeEarned: wallet.lifetime_earned,
        pointValueMznMinor: program.point_value_mzn_minor,
        pointsExpireAfterDays: program.points_expire_after_days,
        tiers: tiersByProgramId.get(card.loyalty_program_id) ?? []
      };

      return buildDigitalCustomerCard(source);
    })
    .filter((card): card is DigitalCustomerCard => card !== null);

  if (cards.length === 0) {
    return { status: "empty" };
  }

  return { status: "populated", cards };
}

function isRenderableCardRow(
  row: CustomerCardRow
): row is CustomerCardRow & { status: CardStatus } {
  return row.status === "active" || row.status === "blocked" || row.status === "archived";
}

export function rowsFrom<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

export function rowFrom<T>(row: unknown): T | null {
  return row && typeof row === "object" ? (row as T) : null;
}

function getCustomerName(profile: ProfileRow | null): string {
  return (
    profile?.display_name?.trim() ||
    profile?.email?.trim() ||
    profile?.phone?.trim() ||
    "Cliente VUYELA"
  );
}

export function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}

export function toMap<T>(items: T[], getKey: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [getKey(item), item]));
}

function groupTiersByProgramId(rows: LoyaltyTierRow[]): Map<string, CustomerCardTier[]> {
  const tiersByProgramId = new Map<string, CustomerCardTier[]>();

  for (const row of rows) {
    const tiers = tiersByProgramId.get(row.loyalty_program_id) ?? [];

    tiers.push({
      id: row.id,
      name: row.name,
      minimumLifetimePoints: row.minimum_lifetime_points,
      sortOrder: row.sort_order
    });
    tiersByProgramId.set(row.loyalty_program_id, tiers);
  }

  return tiersByProgramId;
}
