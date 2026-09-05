import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { OfferEditorialCarousel } from "@/features/marketing/offer-editorial-carousel";
import type { MarketplaceOffer } from "@/features/public-marketplace/model";

const offers: MarketplaceOffer[] = [
  {
    businessId: "business-restaurant",
    businessName: "Restaurante Marés",
    businessSlug: "restaurante-mares",
    categoryName: "Alimentação",
    categorySlug: "alimentacao",
    city: "Maputo",
    description: "Menu de almoço com 20% de benefício.",
    endsAt: null,
    id: "offer-lunch",
    imageUrl: null,
    slug: "almoco-mares",
    startsAt: null,
    title: "Almoço da casa",
    uniquePublicSlug: true
  },
  {
    businessId: "business-pharmacy",
    businessName: "Farmácia Central",
    businessSlug: "farmacia-central",
    categoryName: "Saúde",
    categorySlug: "saude",
    city: "Beira",
    description: "Cuidados essenciais com YELAS em dobro.",
    endsAt: null,
    id: "offer-health",
    imageUrl: null,
    slug: "cuidados-essenciais",
    startsAt: null,
    title: "Bem-estar em dobro",
    uniquePublicSlug: false
  }
];

describe("homepage editorial offer carousel", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true })
    });
  });

  it("filters real offers and preserves their public destinations", () => {
    render(<OfferEditorialCarousel offers={offers} />);

    expect(screen.getByRole("button", { name: "Tudo" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Almoço da casa")).toBeVisible();
    expect(screen.getByText("Bem-estar em dobro")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Cuidar" }));

    expect(screen.queryByText("Almoço da casa")).not.toBeInTheDocument();
    expect(screen.getByText("Bem-estar em dobro")).toBeVisible();
    expect(screen.getByRole("link", { name: /oferta/i })).toHaveAttribute(
      "href",
      "/estabelecimentos/farmacia-central"
    );
    expect(screen.getByRole("button", { name: "Oferta seguinte" })).toBeDisabled();
  });
});
