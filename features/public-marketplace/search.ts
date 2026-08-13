import {
  getBusinessPrimaryCity,
  normalizeSlug,
  type BranchOpeningHours,
  type MarketplaceBusiness,
  type MarketplaceCategory,
  type MarketplaceCity,
  type MarketplaceOffer,
  type PublicMarketplaceSnapshot
} from "./model";

export interface MarketplaceSearchParams {
  q: string;
  category: string;
  city: string;
  offersOnly: boolean;
  openNow: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface MarketplaceSearchViewModel {
  title: string;
  description: string;
  canonicalPath: "/pesquisar";
  sharePath: string;
  indexable: false;
  params: MarketplaceSearchParams;
  businesses: MarketplaceSearchBusiness[];
  offers: MarketplaceOffer[];
  categories: MarketplaceCategory[];
  cities: MarketplaceCity[];
  activeFilters: SearchActiveFilter[];
  seoLinks: SearchSeoLink[];
  supportsOpenNow: boolean;
  supportsLocation: boolean;
}

export interface MarketplaceSearchBusiness extends MarketplaceBusiness {
  distanceKm: number | null;
  isOpenNow: boolean | null;
}

export interface SearchActiveFilter {
  key: keyof MarketplaceSearchParams;
  label: string;
  href: string;
}

export interface SearchSeoLink {
  href: string;
  label: string;
  description: string;
}

export type SearchParamRecord = Record<string, string | string[] | undefined>;

const maxQueryLength = 80;
const maxShareFilters = 5;

export function parseMarketplaceSearchParams(input: SearchParamRecord): MarketplaceSearchParams {
  return {
    q: getStringParam(input.q).slice(0, maxQueryLength),
    category: normalizeSlug(getStringParam(input.category)),
    city: normalizeSlug(getStringParam(input.city)),
    offersOnly: getBooleanParam(input.ofertas),
    openNow: getBooleanParam(input.aberto),
    latitude: getCoordinateParam(input.lat, -90, 90),
    longitude: getCoordinateParam(input.lng, -180, 180)
  };
}

export function buildMarketplaceSearch(
  snapshot: PublicMarketplaceSnapshot,
  params: MarketplaceSearchParams,
  now = new Date()
): MarketplaceSearchViewModel {
  const category = snapshot.categories.find((item) => item.slug === params.category) ?? null;
  const city = snapshot.cities.find((item) => item.slug === params.city) ?? null;
  const supportsOpenNow = snapshot.businesses.some((business) =>
    business.branches.some((branch) => branch.openingHours !== null)
  );
  const supportsLocation = params.latitude !== null && params.longitude !== null;
  const filteredBusinesses = snapshot.businesses
    .map((business): MarketplaceSearchBusiness => ({
      ...business,
      distanceKm: supportsLocation
        ? getBusinessDistanceKm(business, params.latitude, params.longitude)
        : null,
      isOpenNow: getBusinessOpenStatus(business, now)
    }))
    .filter((business) => matchesSearchBusiness(business, params, supportsOpenNow))
    .sort(compareSearchBusinesses);
  const businessIds = new Set(filteredBusinesses.map((business) => business.id));
  const offers = snapshot.offers
    .filter((offer) => {
      if (params.offersOnly && !businessIds.has(offer.businessId)) {
        return false;
      }

      if (!params.offersOnly && businessIds.has(offer.businessId)) {
        return true;
      }

      return matchesText(`${offer.title} ${offer.description} ${offer.businessName}`, params.q);
    })
    .filter((offer) => matchesSearchOffer(offer, params, category, city))
    .slice(0, 24);
  const title = getSearchTitle(params, category, city);

  return {
    title,
    description: getSearchDescription(params, category, city),
    canonicalPath: "/pesquisar",
    sharePath: buildSearchSharePath(params),
    indexable: false,
    params,
    businesses: filteredBusinesses,
    offers,
    categories: snapshot.categories,
    cities: snapshot.cities,
    activeFilters: buildActiveFilters(params, category, city),
    seoLinks: buildSearchSeoLinks(snapshot, params, category, city),
    supportsOpenNow,
    supportsLocation
  };
}

export function buildSearchSharePath(params: MarketplaceSearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.city) {
    searchParams.set("city", params.city);
  }

  if (params.offersOnly) {
    searchParams.set("ofertas", "1");
  }

  if (params.openNow) {
    searchParams.set("aberto", "1");
  }

  if (params.latitude !== null && params.longitude !== null) {
    searchParams.set("lat", params.latitude.toFixed(5));
    searchParams.set("lng", params.longitude.toFixed(5));
  }

  const query = searchParams.toString();

  return query ? `/pesquisar?${query}` : "/pesquisar";
}

export function getBusinessOpenStatus(business: MarketplaceBusiness, now: Date): boolean | null {
  const statuses = business.branches
    .map((branch) => {
      if (!branch.openingHours) {
        return null;
      }

      return isOpenAt(branch.openingHours, now, branch.timezone);
    })
    .filter((status): status is boolean => status !== null);

  if (statuses.length === 0) {
    return null;
  }

  return statuses.some(Boolean);
}

export function isOpenAt(openingHours: BranchOpeningHours, now: Date, timezone: string): boolean {
  const local = getLocalParts(now, timezone);
  const periods = openingHours[local.weekday] ?? [];
  const minutes = local.hour * 60 + local.minute;

  return periods.some((period) => {
    const open = parseTimeMinutes(period.open);
    const close = parseTimeMinutes(period.close);

    if (open === null || close === null || open === close) {
      return false;
    }

    if (open < close) {
      return minutes >= open && minutes < close;
    }

    return minutes >= open || minutes < close;
  });
}

export function getDistanceKm(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): number {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lngDelta = toRadians(destination.longitude - origin.longitude);
  const originLat = toRadians(origin.latitude);
  const destinationLat = toRadians(destination.latitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusKm * c * 10) / 10;
}

function matchesSearchBusiness(
  business: MarketplaceSearchBusiness,
  params: MarketplaceSearchParams,
  supportsOpenNow: boolean
): boolean {
  if (params.category && business.category?.slug !== params.category) {
    return false;
  }

  if (
    params.city &&
    !business.branches.some((branch) => normalizeSlug(branch.city) === params.city)
  ) {
    return false;
  }

  if (params.offersOnly && business.offers.length === 0) {
    return false;
  }

  if (params.openNow && supportsOpenNow && business.isOpenNow !== true) {
    return false;
  }

  if (!params.q) {
    return true;
  }

  return matchesText(
    [
      business.name,
      business.description,
      business.category?.name ?? "",
      getBusinessPrimaryCity(business) ?? "",
      business.branches.map((branch) => `${branch.name} ${branch.city}`).join(" "),
      business.offers.map((offer) => `${offer.title} ${offer.description}`).join(" ")
    ].join(" "),
    params.q
  );
}

function matchesSearchOffer(
  offer: MarketplaceOffer,
  params: MarketplaceSearchParams,
  category: MarketplaceCategory | null,
  city: MarketplaceCity | null
): boolean {
  if (category && offer.categorySlug !== category.slug) {
    return false;
  }

  if (city && offer.city !== city.name) {
    return false;
  }

  if (!params.q) {
    return true;
  }

  return matchesText(`${offer.title} ${offer.description} ${offer.businessName}`, params.q);
}

function compareSearchBusinesses(
  left: MarketplaceSearchBusiness,
  right: MarketplaceSearchBusiness
): number {
  if (left.distanceKm !== null && right.distanceKm !== null) {
    return left.distanceKm - right.distanceKm || left.name.localeCompare(right.name, "pt-MZ");
  }

  if (left.distanceKm !== null) {
    return -1;
  }

  if (right.distanceKm !== null) {
    return 1;
  }

  return left.name.localeCompare(right.name, "pt-MZ");
}

function getBusinessDistanceKm(
  business: MarketplaceBusiness,
  latitude: number | null,
  longitude: number | null
): number | null {
  if (latitude === null || longitude === null) {
    return null;
  }

  const distances = business.branches
    .map((branch) => {
      if (branch.latitude === null || branch.longitude === null) {
        return null;
      }

      return getDistanceKm(
        { latitude, longitude },
        { latitude: branch.latitude, longitude: branch.longitude }
      );
    })
    .filter((distance): distance is number => distance !== null);

  if (distances.length === 0) {
    return null;
  }

  return Math.min(...distances);
}

function matchesText(haystack: string, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalizedHaystack = normalizeText(haystack);
  const tokens = normalizeText(query).split(" ").filter(Boolean);

  return tokens.every((token) => normalizedHaystack.includes(token));
}

function buildActiveFilters(
  params: MarketplaceSearchParams,
  category: MarketplaceCategory | null,
  city: MarketplaceCity | null
): SearchActiveFilter[] {
  const filters: SearchActiveFilter[] = [];
  const entries: Array<{
    key: keyof MarketplaceSearchParams;
    active: boolean;
    label: string;
  }> = [
    { key: "q", active: Boolean(params.q), label: `Texto: ${params.q}` },
    { key: "category", active: Boolean(category), label: `Categoria: ${category?.name ?? ""}` },
    { key: "city", active: Boolean(city), label: `Cidade: ${city?.name ?? ""}` },
    { key: "offersOnly", active: params.offersOnly, label: "Com ofertas activas" },
    { key: "openNow", active: params.openNow, label: "Aberto agora" },
    {
      key: "latitude",
      active: params.latitude !== null && params.longitude !== null,
      label: "Perto de mim"
    }
  ];

  for (const entry of entries) {
    if (!entry.active || filters.length >= maxShareFilters) {
      continue;
    }

    filters.push({
      key: entry.key,
      label: entry.label,
      href: buildSearchSharePath(removeFilter(params, entry.key))
    });
  }

  return filters;
}

function buildSearchSeoLinks(
  snapshot: PublicMarketplaceSnapshot,
  params: MarketplaceSearchParams,
  category: MarketplaceCategory | null,
  city: MarketplaceCity | null
): SearchSeoLink[] {
  const links: SearchSeoLink[] = [];

  if (category) {
    links.push({
      href: `/categorias/${category.slug}`,
      label: `Ver ${category.name}`,
      description: "Pagina canonica da categoria."
    });
  }

  if (city) {
    links.push({
      href: `/locais/${city.slug}`,
      label: `Ver ${city.name}`,
      description: "Pagina canonica da cidade."
    });
  }

  if (city && category) {
    const cityCategory = snapshot.cityCategories.find(
      (item) => item.city.slug === city.slug && item.category.slug === category.slug
    );

    if (cityCategory) {
      links.push({
        href: `/locais/${city.slug}/${category.slug}`,
        label: `${category.name} em ${city.name}`,
        description: "Pagina SEO da combinacao com conteudo suficiente."
      });
    }
  }

  if (params.offersOnly) {
    links.push({
      href: "/ofertas",
      label: "Todas as ofertas",
      description: "Pagina canonica de ofertas activas."
    });
  }

  return links.slice(0, 4);
}

function getSearchTitle(
  params: MarketplaceSearchParams,
  category: MarketplaceCategory | null,
  city: MarketplaceCity | null
): string {
  if (params.q) {
    return `Resultados para "${params.q}"`;
  }

  if (category && city) {
    return `${category.name} em ${city.name}`;
  }

  if (category) {
    return `${category.name} no marketplace`;
  }

  if (city) {
    return `Estabelecimentos em ${city.name}`;
  }

  return "Pesquisar estabelecimentos e ofertas";
}

function getSearchDescription(
  params: MarketplaceSearchParams,
  category: MarketplaceCategory | null,
  city: MarketplaceCity | null
): string {
  const filters = [
    category?.name,
    city?.name,
    params.offersOnly ? "com ofertas activas" : null,
    params.openNow ? "aberto agora quando houver horario publicado" : null,
    params.latitude !== null && params.longitude !== null ? "ordenado por proximidade" : null
  ].filter(Boolean);

  if (filters.length === 0) {
    return "Use texto, categoria, cidade, ofertas e localizacao permitida para encontrar negocios VUYELA.";
  }

  return `Busca filtrada por ${filters.join(", ")}. URLs de busca sao partilháveis, mas ficam fora do indice para evitar combinacoes infinitas.`;
}

function removeFilter(
  params: MarketplaceSearchParams,
  key: keyof MarketplaceSearchParams
): MarketplaceSearchParams {
  const next = { ...params };

  if (key === "q" || key === "category" || key === "city") {
    next[key] = "";
  }

  if (key === "offersOnly" || key === "openNow") {
    next[key] = false;
  }

  if (key === "latitude" || key === "longitude") {
    next.latitude = null;
    next.longitude = null;
  }

  return next;
}

function getStringParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;

  return raw?.trim().replace(/\s+/g, " ") ?? "";
}

function getBooleanParam(value: string | string[] | undefined): boolean {
  const raw = getStringParam(value).toLocaleLowerCase("pt-MZ");

  return raw === "1" || raw === "true" || raw === "sim";
}

function getCoordinateParam(
  value: string | string[] | undefined,
  minimum: number,
  maximum: number
): number | null {
  const raw = getStringParam(value);
  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    return null;
  }

  return parsed;
}

function getLocalParts(
  now: Date,
  timezone: string
): { weekday: keyof BranchOpeningHours; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const weekday = (parts
    .find((part) => part.type === "weekday")
    ?.value.toLocaleLowerCase("en-US") ?? "monday") as keyof BranchOpeningHours;
  const hour = Number.parseInt(parts.find((part) => part.type === "hour")?.value ?? "0", 10);
  const minute = Number.parseInt(parts.find((part) => part.type === "minute")?.value ?? "0", 10);

  return { weekday, hour, minute };
}

function parseTimeMinutes(value: string): number | null {
  const match = /^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(value);

  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-MZ");
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
