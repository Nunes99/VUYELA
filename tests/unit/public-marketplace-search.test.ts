import { describe, expect, it } from "vitest";

import { buildMarketplaceSnapshot } from "@/features/public-marketplace/model";
import type { MarketplaceBusiness } from "@/features/public-marketplace/model";
import {
  buildMarketplaceSearch,
  buildSearchSharePath,
  getDistanceKm,
  isOpenAt,
  parseMarketplaceSearchParams
} from "@/features/public-marketplace/search";

const restaurant = {
  id: "cat-restaurant",
  slug: "restaurantes",
  name: "Restaurantes",
  description: "Restaurantes com benefícios."
};

const gym = {
  id: "cat-gym",
  slug: "ginasios",
  name: "Ginasios",
  description: "Ginasios com pontos."
};

const program = {
  name: "Pontos VUYELA",
  earnRate: 0.05,
  pointValueMznMinor: 100,
  maximumRedemptionPercent: 50,
  pointsExpireAfterDays: null,
  terms: null
};

function business(
  input: Partial<MarketplaceBusiness> & Pick<MarketplaceBusiness, "id" | "slug" | "name">
): MarketplaceBusiness {
  return {
    description: "Negócio com benefícios públicos e pontos VUYELA.",
    phone: null,
    email: null,
    websiteUrl: null,
    logoUrl: null,
    coverUrl: null,
    activatedAt: "2026-08-01T00:00:00.000Z",
    category: restaurant,
    program,
    branches: [
      {
        id: `${input.id}-branch`,
        businessId: input.id,
        slug: "principal",
        name: "Principal",
        city: "Maputo",
        province: "Maputo",
        addressLine: null,
        phone: null,
        email: null,
        latitude: -25.9692,
        longitude: 32.5732,
        isPrimary: true,
        openingHours: {
          thursday: [{ open: "08:00", close: "18:00" }]
        },
        timezone: "Africa/Maputo"
      }
    ],
    offers: [],
    ...input
  };
}

const snapshot = buildMarketplaceSnapshot({
  categories: [restaurant, gym],
  businesses: [
    business({ id: "business-1", slug: "restaurante-mares", name: "Restaurante Mares" }),
    business({
      id: "business-2",
      slug: "ginasio-forte",
      name: "Ginasio Forte",
      category: gym,
      branches: [
        {
          id: "business-2-branch",
          businessId: "business-2",
          slug: "principal",
          name: "Principal",
          city: "Matola",
          province: "Maputo",
          addressLine: null,
          phone: null,
          email: null,
          latitude: -25.9622,
          longitude: 32.4589,
          isPrimary: true,
          openingHours: null,
          timezone: "Africa/Maputo"
        }
      ]
    })
  ],
  offers: [
    {
      id: "offer-1",
      slug: "almoco",
      title: "Desconto de almoco",
      description: "Oferta pública no restaurante.",
      imageUrl: null,
      startsAt: null,
      endsAt: null,
      businessId: "business-1",
      businessSlug: "restaurante-mares",
      businessName: "Restaurante Mares",
      categorySlug: "restaurantes",
      categoryName: "Restaurantes",
      city: "Maputo",
      uniquePublicSlug: false
    }
  ]
});

describe("public marketplace search", () => {
  it("parses shareable search params safely", () => {
    const params = parseMarketplaceSearchParams({
      q: "  mares   maputo  ",
      category: "Restaurantes!",
      city: "Cidade de Maputo",
      ofertas: "sim",
      aberto: "1",
      lat: "-25.9692",
      lng: "32.5732"
    });

    expect(params).toEqual({
      q: "mares maputo",
      category: "restaurantes",
      city: "cidade-de-maputo",
      offersOnly: true,
      openNow: true,
      latitude: -25.9692,
      longitude: 32.5732
    });
    expect(buildSearchSharePath(params)).toContain("/pesquisar?");
  });

  it("filters businesses and offers by text, category, city, and active offers", () => {
    const search = buildMarketplaceSearch(
      snapshot,
      parseMarketplaceSearchParams({
        q: "almoco mares",
        category: "restaurantes",
        city: "maputo",
        ofertas: "1"
      })
    );

    expect(search.indexable).toBe(false);
    expect(search.businesses.map((item) => item.slug)).toEqual(["restaurante-mares"]);
    expect(search.offers.map((item) => item.slug)).toEqual(["almoco"]);
    expect(search.seoLinks.map((link) => link.href)).toContain("/categorias/restaurantes");
    expect(search.seoLinks.map((link) => link.href)).toContain("/locais/maputo");
  });

  it("orders by distance when coordinates are provided", () => {
    const search = buildMarketplaceSearch(
      snapshot,
      parseMarketplaceSearchParams({ lat: "-25.9692", lng: "32.5732" })
    );

    expect(search.supportsLocation).toBe(true);
    expect(search.businesses[0]?.slug).toBe("restaurante-mares");
    expect(search.businesses[0]?.distanceKm).toBe(0);
    expect(
      getDistanceKm(
        { latitude: -25.9692, longitude: 32.5732 },
        { latitude: -25.9622, longitude: 32.4589 }
      )
    ).toBeGreaterThan(1);
  });

  it("filters open now only when public opening hours exist", () => {
    const now = new Date("2026-08-13T10:00:00.000+02:00");
    const search = buildMarketplaceSearch(
      snapshot,
      parseMarketplaceSearchParams({ aberto: "1" }),
      now
    );

    expect(search.supportsOpenNow).toBe(true);
    expect(search.businesses.map((item) => item.slug)).toEqual(["restaurante-mares"]);
    expect(isOpenAt({ thursday: [{ open: "08:00", close: "18:00" }] }, now, "Africa/Maputo")).toBe(
      true
    );
  });
});
