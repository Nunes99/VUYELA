export const MIN_CATEGORY_ESTABLISHMENTS_FOR_INDEX = 1;
export const MIN_CITY_ESTABLISHMENTS_FOR_INDEX = 1;
export const MIN_CITY_CATEGORY_ESTABLISHMENTS_FOR_INDEX = 2;

export interface MarketplaceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  businessCount: number;
  offerCount: number;
  cities: string[];
}

export interface MarketplaceCategorySummary {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface MarketplaceProgram {
  name: string;
  earnRate: number;
  pointValueMznMinor: number;
  maximumRedemptionPercent: number;
  pointsExpireAfterDays: number | null;
  terms: string | null;
}

export interface MarketplaceBranch {
  id: string;
  businessId: string;
  slug: string;
  name: string;
  city: string;
  province: string | null;
  addressLine: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  isPrimary: boolean;
}

export interface MarketplaceOffer {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  businessId: string;
  businessSlug: string;
  businessName: string;
  categorySlug: string | null;
  categoryName: string | null;
  city: string | null;
  uniquePublicSlug: boolean;
}

export interface MarketplaceBusiness {
  id: string;
  slug: string;
  name: string;
  description: string;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  activatedAt: string | null;
  category: MarketplaceCategorySummary | null;
  program: MarketplaceProgram | null;
  branches: MarketplaceBranch[];
  offers: MarketplaceOffer[];
}

export interface MarketplaceCity {
  slug: string;
  name: string;
  province: string | null;
  businessCount: number;
  offerCount: number;
  categories: MarketplaceCategory[];
}

export interface MarketplaceCityCategory {
  city: MarketplaceCity;
  category: MarketplaceCategory;
  businessCount: number;
  offerCount: number;
}

export interface PublicMarketplaceSnapshot {
  businesses: MarketplaceBusiness[];
  categories: MarketplaceCategory[];
  cities: MarketplaceCity[];
  offers: MarketplaceOffer[];
  cityCategories: MarketplaceCityCategory[];
}

export type MarketplaceListKind = "all" | "category" | "city" | "city-category";

export interface MarketplaceListViewModel {
  kind: MarketplaceListKind;
  title: string;
  description: string;
  canonicalPath: string;
  indexable: boolean;
  businesses: MarketplaceBusiness[];
  categories: MarketplaceCategory[];
  cities: MarketplaceCity[];
  offers: MarketplaceOffer[];
  breadcrumbs: MarketplaceBreadcrumb[];
}

export interface MarketplaceDetailViewModel {
  business: MarketplaceBusiness;
  relatedBusinesses: MarketplaceBusiness[];
  relatedOffers: MarketplaceOffer[];
  breadcrumbs: MarketplaceBreadcrumb[];
  canonicalPath: string;
}

export interface MarketplaceOfferViewModel {
  offer: MarketplaceOffer;
  business: MarketplaceBusiness;
  relatedOffers: MarketplaceOffer[];
  breadcrumbs: MarketplaceBreadcrumb[];
  canonicalPath: string;
  indexable: boolean;
}

export interface MarketplaceBreadcrumb {
  name: string;
  path: string;
}

interface BuildMarketplaceInput {
  businesses: Array<
    Omit<MarketplaceBusiness, "category" | "offers"> & { category: CategoryBase | null }
  >;
  categories: CategoryBase[];
  offers: MarketplaceOffer[];
}

interface CategoryBase {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export function buildMarketplaceSnapshot(input: BuildMarketplaceInput): PublicMarketplaceSnapshot {
  const offerSlugCounts = countBy(input.offers, (offer) => offer.slug);
  const offers = input.offers
    .map((offer) => ({
      ...offer,
      uniquePublicSlug: (offerSlugCounts.get(offer.slug) ?? 0) === 1
    }))
    .sort(compareOffers);
  const offersByBusinessId = groupBy(offers, (offer) => offer.businessId);
  const businesses = input.businesses
    .map((business) => ({
      ...business,
      branches: business.branches.slice().sort(compareBranches),
      offers: (offersByBusinessId.get(business.id) ?? []).slice().sort(compareOffers)
    }))
    .filter(isIndexableBusiness)
    .sort(compareBusinesses);
  const indexableBusinessIds = new Set(businesses.map((business) => business.id));
  const categories = buildCategories(input.categories, businesses, offers);
  const cities = buildCities(businesses, offers, categories);
  const cityCategories = buildCityCategories(cities, categories, businesses, offers);

  return {
    businesses,
    categories,
    cities,
    offers: offers.filter((offer) => indexableBusinessIds.has(offer.businessId)),
    cityCategories
  };
}

export function buildEstablishmentsList(
  snapshot: PublicMarketplaceSnapshot
): MarketplaceListViewModel {
  return {
    kind: "all",
    title: "Estabelecimentos com beneficios VUYELA",
    description:
      "Descubra negocios activos em Mocambique com programas de pontos, beneficios e ofertas publicas.",
    canonicalPath: "/estabelecimentos",
    indexable: snapshot.businesses.length > 0,
    businesses: snapshot.businesses,
    categories: snapshot.categories,
    cities: snapshot.cities,
    offers: snapshot.offers.slice(0, 6),
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Estabelecimentos", path: "/estabelecimentos" }
    ]
  };
}

export function buildCategoryList(
  snapshot: PublicMarketplaceSnapshot,
  slug: string
): MarketplaceListViewModel | null {
  const category = snapshot.categories.find((item) => item.slug === slug);

  if (!category) {
    return null;
  }

  const businesses = snapshot.businesses.filter(
    (business) => business.category?.slug === category.slug
  );
  const offers = snapshot.offers.filter((offer) => offer.categorySlug === category.slug);

  return {
    kind: "category",
    title: `${category.name} com pontos VUYELA`,
    description: category.description
      ? `${category.description} Veja estabelecimentos com beneficios e ofertas activas.`
      : `Veja estabelecimentos de ${category.name} com pontos, beneficios e ofertas activas.`,
    canonicalPath: `/categorias/${category.slug}`,
    indexable: businesses.length >= MIN_CATEGORY_ESTABLISHMENTS_FOR_INDEX,
    businesses,
    categories: snapshot.categories.filter((item) => item.slug !== category.slug).slice(0, 8),
    cities: snapshot.cities.filter((city) => category.cities.includes(city.name)),
    offers,
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Categorias", path: "/categorias" },
      { name: category.name, path: `/categorias/${category.slug}` }
    ]
  };
}

export function buildCategoriesIndex(
  snapshot: PublicMarketplaceSnapshot
): MarketplaceListViewModel {
  return {
    kind: "all",
    title: "Categorias com beneficios VUYELA",
    description:
      "Explore categorias de negocios com programas de pontos, ofertas publicas e beneficios claros.",
    canonicalPath: "/categorias",
    indexable: snapshot.categories.length > 0,
    businesses: snapshot.businesses.slice(0, 9),
    categories: snapshot.categories,
    cities: snapshot.cities,
    offers: snapshot.offers.slice(0, 6),
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Categorias", path: "/categorias" }
    ]
  };
}

export function buildCityList(
  snapshot: PublicMarketplaceSnapshot,
  citySlug: string
): MarketplaceListViewModel | null {
  const city = snapshot.cities.find((item) => item.slug === citySlug);

  if (!city) {
    return null;
  }

  const businesses = snapshot.businesses.filter((business) => businessInCity(business, city.name));
  const offers = snapshot.offers.filter((offer) => offer.city === city.name);

  return {
    kind: "city",
    title: `Estabelecimentos VUYELA em ${city.name}`,
    description: `Descubra negocios em ${city.name} com pontos, beneficios promocionais e ofertas activas.`,
    canonicalPath: `/locais/${city.slug}`,
    indexable: businesses.length >= MIN_CITY_ESTABLISHMENTS_FOR_INDEX,
    businesses,
    categories: city.categories,
    cities: snapshot.cities.filter((item) => item.slug !== city.slug).slice(0, 8),
    offers,
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Locais", path: "/locais" },
      { name: city.name, path: `/locais/${city.slug}` }
    ]
  };
}

export function buildCityCategoryList(
  snapshot: PublicMarketplaceSnapshot,
  citySlug: string,
  categorySlug: string
): MarketplaceListViewModel | null {
  const item = snapshot.cityCategories.find(
    (entry) => entry.city.slug === citySlug && entry.category.slug === categorySlug
  );

  if (!item) {
    return null;
  }

  const businesses = snapshot.businesses.filter(
    (business) =>
      business.category?.slug === item.category.slug && businessInCity(business, item.city.name)
  );
  const offers = snapshot.offers.filter(
    (offer) => offer.categorySlug === item.category.slug && offer.city === item.city.name
  );

  return {
    kind: "city-category",
    title: `${item.category.name} com beneficios em ${item.city.name}`,
    description: `Veja ${item.category.name.toLocaleLowerCase("pt-MZ")} em ${item.city.name} com pontos VUYELA, beneficios e ofertas activas.`,
    canonicalPath: `/locais/${item.city.slug}/${item.category.slug}`,
    indexable: businesses.length >= MIN_CITY_CATEGORY_ESTABLISHMENTS_FOR_INDEX,
    businesses,
    categories: item.city.categories.filter((category) => category.slug !== item.category.slug),
    cities: snapshot.cities.filter((city) => city.slug !== item.city.slug).slice(0, 8),
    offers,
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Locais", path: "/locais" },
      { name: item.city.name, path: `/locais/${item.city.slug}` },
      { name: item.category.name, path: `/locais/${item.city.slug}/${item.category.slug}` }
    ]
  };
}

export function buildBusinessDetail(
  snapshot: PublicMarketplaceSnapshot,
  slug: string
): MarketplaceDetailViewModel | null {
  const business = snapshot.businesses.find((item) => item.slug === slug);

  if (!business) {
    return null;
  }

  const primaryCity = getBusinessPrimaryCity(business);
  const relatedBusinesses = snapshot.businesses
    .filter(
      (item) =>
        item.id !== business.id &&
        (item.category?.slug === business.category?.slug ||
          (primaryCity !== null && businessInCity(item, primaryCity)))
    )
    .slice(0, 3);

  return {
    business,
    relatedBusinesses,
    relatedOffers: business.offers.slice(0, 4),
    canonicalPath: `/estabelecimentos/${business.slug}`,
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Estabelecimentos", path: "/estabelecimentos" },
      { name: business.name, path: `/estabelecimentos/${business.slug}` }
    ]
  };
}

export function buildOffersIndex(snapshot: PublicMarketplaceSnapshot): MarketplaceListViewModel {
  return {
    kind: "all",
    title: "Ofertas activas VUYELA",
    description:
      "Encontre ofertas publicas activas em negocios VUYELA e veja onde pode acumular ou usar pontos.",
    canonicalPath: "/ofertas",
    indexable: snapshot.offers.length > 0,
    businesses: snapshot.businesses.slice(0, 9),
    categories: snapshot.categories,
    cities: snapshot.cities,
    offers: snapshot.offers,
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Ofertas", path: "/ofertas" }
    ]
  };
}

export function buildCitiesIndex(snapshot: PublicMarketplaceSnapshot): MarketplaceListViewModel {
  return {
    kind: "all",
    title: "Locais com estabelecimentos VUYELA",
    description:
      "Veja cidades com negocios activos na VUYELA e descubra categorias, beneficios e ofertas por local.",
    canonicalPath: "/locais",
    indexable: snapshot.cities.length > 0,
    businesses: snapshot.businesses.slice(0, 9),
    categories: snapshot.categories,
    cities: snapshot.cities,
    offers: snapshot.offers.slice(0, 6),
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Locais", path: "/locais" }
    ]
  };
}

export function buildOfferDetail(
  snapshot: PublicMarketplaceSnapshot,
  slug: string
): MarketplaceOfferViewModel | null {
  const offer = snapshot.offers.find((item) => item.slug === slug);

  if (!offer || !offer.uniquePublicSlug) {
    return null;
  }

  const business = snapshot.businesses.find((item) => item.id === offer.businessId);

  if (!business) {
    return null;
  }

  const relatedOffers = snapshot.offers
    .filter((item) => item.id !== offer.id && item.businessId === offer.businessId)
    .slice(0, 4);

  return {
    offer,
    business,
    relatedOffers,
    canonicalPath: `/ofertas/${offer.slug}`,
    indexable: offer.uniquePublicSlug,
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      { name: "Ofertas", path: "/ofertas" },
      { name: offer.title, path: `/ofertas/${offer.slug}` }
    ]
  };
}

export function getBusinessPrimaryCity(business: MarketplaceBusiness): string | null {
  const primaryBranch =
    business.branches.find((branch) => branch.isPrimary) ?? business.branches[0];

  return primaryBranch?.city ?? null;
}

export function getBusinessCityLabel(business: MarketplaceBusiness): string {
  const cities = uniqueValues(business.branches.map((branch) => branch.city).filter(Boolean));

  return cities.length > 0 ? cities.join(", ") : "Mocambique";
}

export function getProgramEarnRateLabel(program: MarketplaceProgram | null): string {
  if (!program) {
    return "Programa de pontos activo";
  }

  const percent = Math.round(program.earnRate * 100);

  if (percent <= 0) {
    return "Beneficios configurados";
  }

  return `${percent}% em pontos`;
}

export function getPointValueLabel(program: MarketplaceProgram | null): string {
  if (!program) {
    return "1 ponto = 1 MZN promocional";
  }

  return `1 ponto = ${formatMznMinor(program.pointValueMznMinor)} promocional`;
}

export function getExpiryLabel(program: MarketplaceProgram | null): string {
  if (!program?.pointsExpireAfterDays) {
    return "Sem expiracao automatica publicada";
  }

  return `Expira em ${program.pointsExpireAfterDays.toLocaleString("pt-MZ")} dias`;
}

export function formatMznMinor(value: number): string {
  const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

  return `${Math.floor(safeValue / 100).toLocaleString("pt-MZ")},${String(safeValue % 100).padStart(
    2,
    "0"
  )} MZN`;
}

export function cityNameToSlug(city: string): string {
  return normalizeSlug(city);
}

export function normalizeCityName(city: string): string {
  return city.trim().replace(/\s+/g, " ");
}

export function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-MZ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isIndexableBusiness(business: MarketplaceBusiness): boolean {
  return Boolean(
    business.name.trim() &&
    business.slug.trim() &&
    business.description.trim() &&
    business.category &&
    business.program &&
    business.branches.length > 0
  );
}

export function isIndexableCategory(category: MarketplaceCategory): boolean {
  return category.businessCount >= MIN_CATEGORY_ESTABLISHMENTS_FOR_INDEX;
}

export function isIndexableCity(city: MarketplaceCity): boolean {
  return city.businessCount >= MIN_CITY_ESTABLISHMENTS_FOR_INDEX;
}

export function isIndexableCityCategory(item: MarketplaceCityCategory): boolean {
  return item.businessCount >= MIN_CITY_CATEGORY_ESTABLISHMENTS_FOR_INDEX;
}

export function isIndexableOffer(offer: MarketplaceOffer): boolean {
  return offer.uniquePublicSlug;
}

export function businessInCity(business: MarketplaceBusiness, city: string): boolean {
  return business.branches.some((branch) => branch.city === city);
}

function buildCategories(
  categories: CategoryBase[],
  businesses: MarketplaceBusiness[],
  offers: MarketplaceOffer[]
): MarketplaceCategory[] {
  return categories
    .map((category) => {
      const categoryBusinesses = businesses.filter(
        (business) => business.category?.id === category.id
      );
      const businessIds = new Set(categoryBusinesses.map((business) => business.id));

      return {
        ...category,
        businessCount: categoryBusinesses.length,
        offerCount: offers.filter((offer) => businessIds.has(offer.businessId)).length,
        cities: uniqueValues(
          categoryBusinesses.flatMap((business) => business.branches.map((branch) => branch.city))
        ).sort(compareText)
      };
    })
    .filter(isIndexableCategory)
    .sort(
      (left, right) =>
        right.businessCount - left.businessCount || compareText(left.name, right.name)
    );
}

function buildCities(
  businesses: MarketplaceBusiness[],
  offers: MarketplaceOffer[],
  categories: MarketplaceCategory[]
): MarketplaceCity[] {
  const cityNames = uniqueValues(
    businesses.flatMap((business) => business.branches.map((branch) => branch.city))
  );

  return cityNames
    .map((cityName) => {
      const cityBusinesses = businesses.filter((business) => businessInCity(business, cityName));
      const businessIds = new Set(cityBusinesses.map((business) => business.id));
      const categoryIds = new Set(
        cityBusinesses
          .map((business) => business.category?.id)
          .filter((categoryId): categoryId is string => Boolean(categoryId))
      );
      const primaryProvince =
        cityBusinesses
          .flatMap((business) => business.branches)
          .find((branch) => branch.city === cityName && branch.province)?.province ?? null;

      return {
        slug: cityNameToSlug(cityName),
        name: cityName,
        province: primaryProvince,
        businessCount: cityBusinesses.length,
        offerCount: offers.filter((offer) => businessIds.has(offer.businessId)).length,
        categories: categories.filter((category) => categoryIds.has(category.id))
      };
    })
    .filter(isIndexableCity)
    .sort(
      (left, right) =>
        right.businessCount - left.businessCount || compareText(left.name, right.name)
    );
}

function buildCityCategories(
  cities: MarketplaceCity[],
  categories: MarketplaceCategory[],
  businesses: MarketplaceBusiness[],
  offers: MarketplaceOffer[]
): MarketplaceCityCategory[] {
  const entries: MarketplaceCityCategory[] = [];

  for (const city of cities) {
    for (const category of categories) {
      const scopedBusinesses = businesses.filter(
        (business) => business.category?.id === category.id && businessInCity(business, city.name)
      );

      if (scopedBusinesses.length === 0) {
        continue;
      }

      const businessIds = new Set(scopedBusinesses.map((business) => business.id));
      entries.push({
        city,
        category,
        businessCount: scopedBusinesses.length,
        offerCount: offers.filter((offer) => businessIds.has(offer.businessId)).length
      });
    }
  }

  return entries.filter(isIndexableCityCategory).sort((left, right) => {
    return (
      compareText(left.city.name, right.city.name) ||
      right.businessCount - left.businessCount ||
      compareText(left.category.name, right.category.name)
    );
  });
}

function compareBusinesses(left: MarketplaceBusiness, right: MarketplaceBusiness): number {
  const leftDate = left.activatedAt ? Date.parse(left.activatedAt) : 0;
  const rightDate = right.activatedAt ? Date.parse(right.activatedAt) : 0;

  return rightDate - leftDate || compareText(left.name, right.name);
}

function compareBranches(left: MarketplaceBranch, right: MarketplaceBranch): number {
  if (left.isPrimary !== right.isPrimary) {
    return left.isPrimary ? -1 : 1;
  }

  return compareText(left.city, right.city) || compareText(left.name, right.name);
}

function compareOffers(left: MarketplaceOffer, right: MarketplaceOffer): number {
  const leftDate = left.endsAt ? Date.parse(left.endsAt) : Number.MAX_SAFE_INTEGER;
  const rightDate = right.endsAt ? Date.parse(right.endsAt) : Number.MAX_SAFE_INTEGER;

  return leftDate - rightDate || compareText(left.title, right.title);
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "pt-MZ");
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

function countBy<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}
