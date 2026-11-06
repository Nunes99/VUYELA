import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionPreferences, VisualPreferencesProvider } from "@lemote/vuyela-design-system";

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
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.vyMotion;
    delete document.documentElement.dataset.vyTransparency;
  });
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

  it("stops autoplay and uses instant manual scrolling when the visitor reduces motion", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false })
    });
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scroll
    });
    render(
      <VisualPreferencesProvider>
        <MotionPreferences />
        <OfferEditorialCarousel offers={offers} />
      </VisualPreferencesProvider>
    );
    scroll.mockClear();
    act(() => vi.advanceTimersByTime(5300));
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
    fireEvent.change(screen.getByLabelText("Movimento"), { target: { value: "reduce" } });
    scroll.mockClear();
    act(() => vi.advanceTimersByTime(11000));
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Oferta seguinte" }));
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: "instant" }));
  });
});
