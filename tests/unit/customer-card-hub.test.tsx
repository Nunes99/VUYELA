import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { CustomerCardHub } from "@/features/customer-dashboard/card-hub";
import type { DigitalCustomerCard } from "@/features/customer-cards/model";

const baseCard: DigitalCustomerCard = {
  id: "card-active",
  businessId: "business-active",
  businessName: "MangoShop",
  businessLogoUrl: null,
  customerName: "Nunes José",
  cardNumber: "VY-ACTIVE-01",
  status: "active",
  statusLabel: "Cartão digital",
  joinedAt: "2026-08-20T10:00:00.000Z",
  availablePoints: 120,
  valueMzn: 120,
  currentTierName: "Base",
  nextTierName: null,
  pointsUntilNextTier: null,
  expiryLabel: "YELAS sem expiração configurada",
  qrCode: "VY-ACTIVE-01",
  isFavorite: false
};

describe("customer card hub", () => {
  it("filters real cards by status and favorite preference", () => {
    render(
      <CustomerCardHub
        cards={[
          baseCard,
          {
            ...baseCard,
            id: "card-blocked",
            businessId: "business-blocked",
            businessName: "Café Maputo",
            cardNumber: "VY-BLOCKED-01",
            qrCode: "VY-BLOCKED-01",
            status: "blocked",
            statusLabel: "Bloqueado",
            isFavorite: true
          }
        ]}
      />
    );

    expect(
      screen
        .getByRole("link", { name: "Abrir cartão MangoShop" })
        .querySelector(".customer-card-hub-item__content > small")
    ).toHaveTextContent("Equivale a 120 MZN");

    fireEvent.click(screen.getByRole("button", { name: "Ativos" }));
    expect(screen.getByRole("link", { name: "Abrir cartão MangoShop" })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Abrir cartão Café Maputo" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Favoritos" }));
    expect(screen.queryByRole("link", { name: "Abrir cartão MangoShop" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir cartão Café Maputo" })).toBeVisible();
  });
});
