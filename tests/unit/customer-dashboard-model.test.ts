import { describe, expect, it } from "vitest";

import {
  buildCustomerDashboardViewModel,
  getActivityDescription,
  getActivityPoints,
  getActivityTone
} from "@/features/customer-dashboard/model";
import type { DigitalCustomerCard } from "@/features/customer-cards/model";

const baseCard: DigitalCustomerCard = {
  id: "card-1",
  businessId: "business-1",
  businessName: "Restaurante Mares",
  businessLogoUrl: null,
  customerName: "Ana Mucavele",
  cardNumber: "VY-8F2K-91M",
  status: "active",
  statusLabel: "Cartão digital",
  joinedAt: "2026-08-13T06:00:00.000Z",
  availablePoints: 250,
  valueMzn: 250,
  currentTierName: "Prata",
  nextTierName: "Ouro",
  pointsUntilNextTier: 750,
  expiryLabel: "Pontos expiram 180 dias após serem ganhos",
  qrCode: "VUYELA:CARD:business-1:VY-8F2K-91M"
};

describe("customer dashboard model", () => {
  it("summarizes cards without mixing business-specific balances", () => {
    const dashboard = buildCustomerDashboardViewModel({
      cards: [
        baseCard,
        {
          ...baseCard,
          id: "card-2",
          status: "blocked",
          availablePoints: 100,
          valueMzn: 50
        }
      ],
      activity: [],
      offers: [],
      notifications: [
        {
          id: "notification-1",
          businessName: "Restaurante Mares",
          subject: "Pontos em dobro",
          body: "Volte este fim de semana.",
          createdAt: "2026-08-18T10:00:00.000Z",
          readAt: null
        }
      ],
      profile: {
        displayName: "Ana Mucavele",
        email: "ana@example.com",
        phone: null,
        locale: "pt-MZ",
        marketingConsent: true
      }
    });

    expect(dashboard.totalPoints).toBe(350);
    expect(dashboard.totalValueMzn).toBe(300);
    expect(dashboard.activeCardCount).toBe(1);
    expect(dashboard.hasCards).toBe(true);
    expect(dashboard.unreadNotificationCount).toBe(1);
  });

  it("builds activity copy and signed point movement", () => {
    expect(
      getActivityDescription({ pointsEarned: 5, pointsRedeemed: 0, netAmountMznMinor: 10000 })
    ).toBe("Ganhou 5 pontos");
    expect(
      getActivityDescription({ pointsEarned: 0, pointsRedeemed: 20, netAmountMznMinor: 8000 })
    ).toBe("Resgatou 20 pontos");
    expect(
      getActivityDescription({ pointsEarned: 2, pointsRedeemed: 10, netAmountMznMinor: 8000 })
    ).toBe("Resgatou 10 pontos e ganhou 2 pontos");

    expect(getActivityPoints({ pointsEarned: 2, pointsRedeemed: 10 })).toBe(-8);
    expect(getActivityTone(-8)).toBe("redeem");
    expect(getActivityTone(0)).toBe("neutral");
    expect(getActivityTone(5)).toBe("earn");
  });
});
