import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

import {
  buildBusinessDetail,
  buildCategoryList,
  buildCategoriesIndex,
  buildCityCategoryList,
  buildCityList,
  buildCitiesIndex,
  buildEstablishmentsList,
  buildMarketplaceSnapshot,
  buildOfferDetail,
  buildOffersIndex,
  normalizeCityName
} from "./model";
import type {
  MarketplaceBranch,
  MarketplaceBusiness,
  MarketplaceCategory,
  MarketplaceDetailViewModel,
  MarketplaceListViewModel,
  MarketplaceOffer,
  MarketplaceOfferViewModel,
  MarketplaceProgram,
  PublicMarketplaceSnapshot
} from "./model";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface BusinessRow {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_url: string | null;
  activated_at: string | null;
}

interface BranchRow {
  id: string;
  business_id: string;
  slug: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_line: string | null;
  city: string;
  province: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  is_primary: boolean;
}

interface ProgramRow {
  business_id: string;
  name: string;
  earn_rate: number | string;
  point_value_mzn_minor: number;
  maximum_redemption_percent: number | string;
  points_expire_after_days: number | null;
  terms: string | null;
}

interface OfferRow {
  id: string;
  business_id: string;
  slug: string;
  title: string;
  description: string;
  starts_at: string | null;
  ends_at: string | null;
}

export type PublicMarketplaceState =
  | { status: "empty"; snapshot: PublicMarketplaceSnapshot }
  | { status: "error"; message: string; snapshot: PublicMarketplaceSnapshot }
  | { status: "ready"; snapshot: PublicMarketplaceSnapshot };

const emptySnapshot: PublicMarketplaceSnapshot = {
  businesses: [],
  categories: [],
  cities: [],
  offers: [],
  cityCategories: []
};

export async function getPublicMarketplaceSnapshot(): Promise<PublicMarketplaceState> {
  if (!isSupabaseConfigured()) {
    return { status: "empty", snapshot: emptySnapshot };
  }

  const supabase = createSupabasePublicClient();
  const [
    { data: categoryData, error: categoryError },
    { data: businessData, error: businessError },
    { data: branchData, error: branchError },
    { data: programData, error: programError },
    { data: offerData, error: offerError }
  ] = await Promise.all([
    supabase
      .from("business_categories")
      .select("id, slug, name, description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("businesses")
      .select(
        "id, category_id, slug, name, description, phone, email, website_url, logo_url, cover_url, activated_at"
      )
      .eq("status", "active")
      .order("activated_at", { ascending: false }),
    supabase
      .from("branches")
      .select(
        "id, business_id, slug, name, phone, email, address_line, city, province, latitude, longitude, is_primary"
      )
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("loyalty_programs")
      .select(
        "business_id, name, earn_rate, point_value_mzn_minor, maximum_redemption_percent, points_expire_after_days, terms"
      )
      .eq("status", "active"),
    supabase
      .from("offers")
      .select("id, business_id, slug, title, description, starts_at, ends_at")
      .eq("is_public", true)
      .eq("is_active", true)
      .order("ends_at", { ascending: true, nullsFirst: false })
  ]);

  if (categoryError || businessError || branchError || programError || offerError) {
    return {
      status: "error",
      message: "Nao foi possivel carregar o marketplace publico.",
      snapshot: emptySnapshot
    };
  }

  const categories = rowsFrom<CategoryRow>(categoryData).map(mapCategory);
  const categoryById = toMap(categories, (category) => category.id);
  const branchRows = rowsFrom<BranchRow>(branchData);
  const branchesByBusinessId = groupBy(branchRows.map(mapBranch), (branch) => branch.businessId);
  const programByBusinessId = toMap(
    rowsFrom<ProgramRow>(programData).map(mapProgram),
    (program) => program.id
  );
  const businessRows = rowsFrom<BusinessRow>(businessData);
  const activeBusinessIds = new Set(businessRows.map((business) => business.id));
  const businesses = businessRows.map((business) =>
    mapBusiness(
      business,
      categoryById.get(business.category_id ?? "") ?? null,
      programByBusinessId.get(business.id) ?? null,
      branchesByBusinessId.get(business.id) ?? []
    )
  );
  const businessById = toMap(businesses, (business) => business.id);
  const offers = rowsFrom<OfferRow>(offerData)
    .filter((offer) => activeBusinessIds.has(offer.business_id))
    .map((offer) => mapOffer(offer, businessById.get(offer.business_id) ?? null))
    .filter((offer): offer is MarketplaceOffer => offer !== null);
  const snapshot = buildMarketplaceSnapshot({
    businesses,
    categories,
    offers
  });

  if (snapshot.businesses.length === 0) {
    return { status: "empty", snapshot };
  }

  return { status: "ready", snapshot };
}

export async function getEstablishmentsList(): Promise<MarketplaceListViewModel> {
  const state = await getPublicMarketplaceSnapshot();

  return buildEstablishmentsList(state.snapshot);
}

export async function getCategoriesList(): Promise<MarketplaceListViewModel> {
  const state = await getPublicMarketplaceSnapshot();

  return buildCategoriesIndex(state.snapshot);
}

export async function getCategoryPage(slug: string): Promise<MarketplaceListViewModel | null> {
  const state = await getPublicMarketplaceSnapshot();

  return buildCategoryList(state.snapshot, slug);
}

export async function getCityPage(citySlug: string): Promise<MarketplaceListViewModel | null> {
  const state = await getPublicMarketplaceSnapshot();

  return buildCityList(state.snapshot, citySlug);
}

export async function getCitiesList(): Promise<MarketplaceListViewModel> {
  const state = await getPublicMarketplaceSnapshot();

  return buildCitiesIndex(state.snapshot);
}

export async function getCityCategoryPage(
  citySlug: string,
  categorySlug: string
): Promise<MarketplaceListViewModel | null> {
  const state = await getPublicMarketplaceSnapshot();

  return buildCityCategoryList(state.snapshot, citySlug, categorySlug);
}

export async function getBusinessPage(slug: string): Promise<MarketplaceDetailViewModel | null> {
  const state = await getPublicMarketplaceSnapshot();

  return buildBusinessDetail(state.snapshot, slug);
}

export async function getOffersList(): Promise<MarketplaceListViewModel> {
  const state = await getPublicMarketplaceSnapshot();

  return buildOffersIndex(state.snapshot);
}

export async function getOfferPage(slug: string): Promise<MarketplaceOfferViewModel | null> {
  const state = await getPublicMarketplaceSnapshot();

  return buildOfferDetail(state.snapshot, slug);
}

function mapCategory(row: CategoryRow): MarketplaceCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description?.trim() ?? "",
    businessCount: 0,
    offerCount: 0,
    cities: []
  };
}

function mapBusiness(
  row: BusinessRow,
  category: MarketplaceCategory | null,
  program: MarketplaceProgram | null,
  branches: MarketplaceBranch[]
): MarketplaceBusiness {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description?.trim() ?? "",
    phone: row.phone,
    email: row.email,
    websiteUrl: row.website_url,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    activatedAt: row.activated_at,
    category,
    program,
    branches,
    offers: []
  };
}

function mapBranch(row: BranchRow): MarketplaceBranch {
  return {
    id: row.id,
    businessId: row.business_id,
    slug: row.slug,
    name: row.name,
    city: normalizeCityName(row.city),
    province: row.province?.trim() || null,
    addressLine: row.address_line?.trim() || null,
    phone: row.phone?.trim() || null,
    email: row.email?.trim() || null,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    isPrimary: row.is_primary
  };
}

function mapProgram(row: ProgramRow): MarketplaceProgram & { id: string } {
  return {
    id: row.business_id,
    name: row.name,
    earnRate: toNumber(row.earn_rate),
    pointValueMznMinor: row.point_value_mzn_minor,
    maximumRedemptionPercent: toNumber(row.maximum_redemption_percent),
    pointsExpireAfterDays: row.points_expire_after_days,
    terms: row.terms?.trim() || null
  };
}

function mapOffer(row: OfferRow, business: MarketplaceBusiness | null): MarketplaceOffer | null {
  if (!business) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    businessId: row.business_id,
    businessSlug: business.slug,
    businessName: business.name,
    categorySlug: business.category?.slug ?? null,
    categoryName: business.category?.name ?? null,
    city: business.branches[0]?.city ?? null,
    uniquePublicSlug: false
  };
}

function rowsFrom<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

function toMap<T>(items: T[], getKey: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [getKey(item), item]));
}

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const values = grouped.get(key) ?? [];
    values.push(item);
    grouped.set(key, values);
  }

  return grouped;
}

function toNumber(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = toNumber(value);

  return Number.isFinite(parsed) ? parsed : null;
}
