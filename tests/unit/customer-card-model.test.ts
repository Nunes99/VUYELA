import { describe, expect, it } from "vitest";

import {
  buildDigitalCustomerCard,
  buildIdentificationQrCode,
  calculatePointsValueMzn
} from "@/features/customer-cards/model";

describe("customer card model", () => {
  it("calculates MZN equivalent from configurable point value", () => {
    expect(calculatePointsValueMzn(250, 100)).toBe(250);
    expect(calculatePointsValueMzn(250, 50)).toBe(125);
  });

  it("builds the digital card view model with tier and expiry labels", () => {
    expect(
      buildDigitalCustomerCard({
        id: "card-1",
        businessId: "business-1",
        businessName: "Restaurante Mares",
        businessLogoUrl: null,
        customerName: "Ana Mucavele",
        cardNumber: "VY-8F2K-91M",
        status: "active",
        joinedAt: "2026-08-13T06:00:00.000Z",
        availablePoints: 250,
        lifetimeEarned: 1_250,
        pointValueMznMinor: 100,
        pointsExpireAfterDays: 180,
        tiers: [
          {
            id: "tier-base",
            name: "Base",
            minimumLifetimePoints: 0,
            sortOrder: 1
          },
          {
            id: "tier-prata",
            name: "Prata",
            minimumLifetimePoints: 1_000,
            sortOrder: 2
          },
          {
            id: "tier-ouro",
            name: "Ouro",
            minimumLifetimePoints: 2_000,
            sortOrder: 3
          }
        ]
      })
    ).toMatchObject({
      businessName: "Restaurante Mares",
      valueMzn: 250,
      currentTierName: "Prata",
      nextTierName: "Ouro",
      pointsUntilNextTier: 750,
      expiryLabel: "Pontos expiram 180 dias apos serem ganhos",
      qrCode: "VUYELA:CARD:business-1:VY-8F2K-91M"
    });
  });

  it("falls back to base tier and no configured expiry", () => {
    expect(
      buildDigitalCustomerCard({
        id: "card-1",
        businessId: "business-1",
        businessName: "Farmacia Central",
        businessLogoUrl: null,
        customerName: "Ana Mucavele",
        cardNumber: "VY-8F2K-91M",
        status: "blocked",
        joinedAt: "2026-08-13T06:00:00.000Z",
        availablePoints: 0,
        lifetimeEarned: 0,
        pointValueMznMinor: 100,
        pointsExpireAfterDays: null,
        tiers: []
      })
    ).toMatchObject({
      statusLabel: "Bloqueado",
      currentTierName: "Base",
      nextTierName: null,
      pointsUntilNextTier: null,
      expiryLabel: "Pontos sem expiração configurada"
    });
  });

  it("keeps QR codes scoped to identification, not wallet balances", () => {
    const qrCode = buildIdentificationQrCode("business-1", "VY-8F2K-91M");

    expect(qrCode).toBe("VUYELA:CARD:business-1:VY-8F2K-91M");
    expect(qrCode).not.toContain("250");
    expect(qrCode).not.toContain("MZN");
  });
});
