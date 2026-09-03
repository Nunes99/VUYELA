import { describe, expect, it } from "vitest";

import {
  buildCustomerDashboardViewModel,
  getLedgerActivityDescription,
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
        avatarUrl: null,
        locale: "pt-MZ",
        marketingConsent: true,
        dateOfBirth: null
      }
    });

    expect(dashboard.totalPoints).toBe(350);
    expect(dashboard.totalValueMzn).toBe(300);
    expect(dashboard.activeCardCount).toBe(1);
    expect(dashboard.hasCards).toBe(true);
    expect(dashboard.unreadNotificationCount).toBe(1);
  });

  it("builds separate YELAS copy for ledger credit and debit movements", () => {
    expect(getLedgerActivityDescription({ type: "redeem", reason: "purchase_redemption" })).toBe(
      "YELAS utilizadas no pagamento"
    );
    expect(
      getLedgerActivityDescription({
        type: "earn",
        reason: "purchase_earn_after_redemption"
      })
    ).toBe("YELAS ganhas sobre o valor pago");
    expect(getActivityTone(-8)).toBe("redeem");
    expect(getActivityTone(0)).toBe("neutral");
    expect(getActivityTone(5)).toBe("earn");
  });
});
