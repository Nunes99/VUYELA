import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CustomerOfferGrid } from "@/features/customer-dashboard/offer-grid";
import type { CustomerExploreOffer } from "@/features/customer-dashboard/model";

const offers: CustomerExploreOffer[] = [
  {
    id: "offer-restaurant",
    businessName: "Restaurante Marés",
    title: "Sobremesa incluída",
    description: "Benefício para membros VUYELA.",
    categorySlug: "restaurantes",
    categoryName: "Restaurantes",
    href: "/estabelecimentos/restaurante-mares"
  },
  {
    id: "offer-health",
    businessName: "Farmácia Central",
    title: "Pontos em dobro",
    description: "Campanha de saúde e bem-estar.",
    categorySlug: "saude",
    categoryName: "Saúde",
    href: "/estabelecimentos/farmacia-central"
  }
];

describe("customer offer grid", () => {
  it("filters real offers by every available category and restores all results", () => {
    render(<CustomerOfferGrid offers={offers} showFilters />);

    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Sobremesa incluída")).toBeVisible();
    expect(screen.getByText("Pontos em dobro")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Saúde" }));

    expect(screen.queryByText("Sobremesa incluída")).not.toBeInTheDocument();
    expect(screen.getByText("Pontos em dobro")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver oferta" })).toHaveAttribute(
      "href",
      "/estabelecimentos/farmacia-central"
    );

    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    expect(screen.getByText("Sobremesa incluída")).toBeVisible();
  });
});
