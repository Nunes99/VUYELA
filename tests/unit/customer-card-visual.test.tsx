import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CustomerCardVisual } from "@/features/customer-cards/customer-card-visual";
import type { DigitalCustomerCard } from "@/features/customer-cards/model";

const card: DigitalCustomerCard = {
  id: "card-1",
  businessId: "business-1",
  businessName: "Barbershop 21",
  businessLogoUrl: null,
  customerName: "Nunes José",
  cardNumber: "VY-6885-B19F",
  status: "active",
  statusLabel: "Cartão digital",
  joinedAt: "2026-08-20T10:00:00.000Z",
  availablePoints: 250,
  valueMzn: 250,
  currentTierName: "Base",
  nextTierName: null,
  pointsUntilNextTier: null,
  expiryLabel: "Pontos sem expiração configurada",
  qrCode: "VUYELA:CARD:business-1:VY-6885-B19F"
};

describe("customer digital card visual", () => {
  it("switches accessibly between the front and back without changing the QR payload", () => {
    render(<CustomerCardVisual card={card} />);

    expect(screen.getByLabelText("Frente do cartão Barbershop 21")).toBeVisible();
    expect(
      screen.getByRole("img", { name: `QR de identificação: ${card.cardNumber}` })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Mostrar o verso do cartão" }));

    expect(screen.getByLabelText("Verso do cartão Barbershop 21")).toBeVisible();
    expect(screen.getByRole("button", { name: "Mostrar a frente do cartão" })).toBeVisible();
    expect(screen.getByText("Apresente este código no estabelecimento.")).toBeVisible();
  });
});
