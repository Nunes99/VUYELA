import { describe, expect, it } from "vitest";

import {
  buildBusinessDetail,
  buildCategoryList,
  buildCityCategoryList,
  buildEstablishmentsList,
  buildMarketplaceSnapshot,
  buildOfferDetail,
  cityNameToSlug,
  getPointValueLabel,
  isIndexableOffer
} from "@/features/public-marketplace/model";
import type { MarketplaceBusiness, MarketplaceOffer } from "@/features/public-marketplace/model";

const categories = [
  {
    id: "cat-restaurant",
    slug: "restaurantes",
    name: "Restaurantes",
    description: "Restaurantes com beneficios claros."
  },
  {
    id: "cat-gym",
    slug: "ginasios",
    name: "Ginasios",
    description: "Ginasios com programas de pontos."
  }
];

const program = {
  name: "Pontos VUYELA",
  earnRate: 0.05,
  pointValueMznMinor: 100,
  maximumRedemptionPercent: 50,
  pointsExpireAfterDays: 365,
  terms: "Pontos validos apenas no negocio emissor."
};

function business(
  input: Partial<MarketplaceBusiness> & Pick<MarketplaceBusiness, "id" | "slug" | "name">
): MarketplaceBusiness {
  return {
    description: "Programa de pontos com beneficios publicados para clientes voltarem.",
    phone: null,
    email: null,
    websiteUrl: null,
    logoUrl: null,
    coverUrl: null,
    activatedAt: "2026-08-01T00:00:00.000Z",
    category: categories[0],
    program,
    branches: [
      {
        id: `${input.id}-branch`,
        businessId: input.id,
        slug: "principal",
        name: "Principal",
        city: "Maputo",
        province: "Maputo",
        addressLine: "Baixa",
        phone: null,
        email: null,
        latitude: null,
        longitude: null,
        isPrimary: true
      }
    ],
    offers: [],
    ...input
  };
}

function offer(
  input: Partial<MarketplaceOffer> & Pick<MarketplaceOffer, "id" | "slug" | "businessId">
): MarketplaceOffer {
  return {
    title: "Desconto de almoco",
    description: "Oferta publica activa para clientes VUYELA.",
    startsAt: "2026-08-01T00:00:00.000Z",
    endsAt: null,
    businessSlug: "restaurante-mares",
    businessName: "Restaurante Mares",
    categorySlug: "restaurantes",
    categoryName: "Restaurantes",
    city: "Maputo",
    uniquePublicSlug: false,
    ...input
  };
}

describe("public marketplace model", () => {
  it("normalizes city names into stable route slugs", () => {
    expect(cityNameToSlug("Cidade de Maputo")).toBe("cidade-de-maputo");
    expect(cityNameToSlug("Nampula")).toBe("nampula");
  });

  it("builds category and city aggregates from indexable businesses", () => {
    const snapshot = buildMarketplaceSnapshot({
      categories,
      businesses: [
        business({ id: "business-1", slug: "restaurante-mares", name: "Restaurante Mares" }),
        business({
          id: "business-2",
          slug: "ginasio-forte",
          name: "Ginasio Forte",
          category: categories[1],
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
              latitude: null,
              longitude: null,
              isPrimary: true
            }
          ]
        })
      ],
      offers: [offer({ id: "offer-1", slug: "almoco", businessId: "business-1" })]
    });

    expect(snapshot.businesses).toHaveLength(2);
    expect(snapshot.categories.map((category) => category.slug)).toEqual([
      "ginasios",
      "restaurantes"
    ]);
    expect(snapshot.cities.map((city) => city.slug)).toEqual(["maputo", "matola"]);

    const restaurants = buildCategoryList(snapshot, "restaurantes");
    expect(restaurants?.indexable).toBe(true);
    expect(restaurants?.businesses[0]?.name).toBe("Restaurante Mares");
  });

  it("does not index low-value city and category combinations", () => {
    const snapshot = buildMarketplaceSnapshot({
      categories,
      businesses: [
        business({ id: "business-1", slug: "restaurante-mares", name: "Restaurante Mares" })
      ],
      offers: []
    });

    expect(buildCityCategoryList(snapshot, "maputo", "restaurantes")).toBeNull();
  });

  it("indexes offer detail pages only when the public offer slug is unique", () => {
    const businesses = [
      business({ id: "business-1", slug: "restaurante-mares", name: "Restaurante Mares" }),
      business({ id: "business-2", slug: "restaurante-sol", name: "Restaurante Sol" })
    ];
    const snapshot = buildMarketplaceSnapshot({
      categories,
      businesses,
      offers: [
        offer({ id: "offer-1", slug: "almoco", businessId: "business-1" }),
        offer({
          id: "offer-2",
          slug: "almoco",
          businessId: "business-2",
          businessSlug: "restaurante-sol",
          businessName: "Restaurante Sol"
        }),
        offer({ id: "offer-3", slug: "fim-de-semana", businessId: "business-1" })
      ]
    });

    expect(snapshot.offers.map((item) => item.slug)).toEqual(["almoco", "almoco", "fim-de-semana"]);
    expect(isIndexableOffer(snapshot.offers.find((item) => item.slug === "fim-de-semana")!)).toBe(
      true
    );
    expect(snapshot.offers.filter((item) => item.slug === "almoco").every(isIndexableOffer)).toBe(
      false
    );
    expect(buildOfferDetail(snapshot, "almoco")).toBeNull();
    expect(buildOfferDetail(snapshot, "fim-de-semana")?.business.name).toBe("Restaurante Mares");
  });

  it("builds list and detail view-models with canonical paths", () => {
    const snapshot = buildMarketplaceSnapshot({
      categories,
      businesses: [
        business({ id: "business-1", slug: "restaurante-mares", name: "Restaurante Mares" })
      ],
      offers: []
    });

    expect(buildEstablishmentsList(snapshot).canonicalPath).toBe("/estabelecimentos");
    expect(buildBusinessDetail(snapshot, "restaurante-mares")?.canonicalPath).toBe(
      "/estabelecimentos/restaurante-mares"
    );
    expect(getPointValueLabel(program)).toBe("1 ponto = 1,00 MZN promocional");
  });
});
