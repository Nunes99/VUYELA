import { describe, expect, it } from "vitest";

import {
  buildBusinessDashboardViewModel,
  formatMznMinor,
  formatPercent,
  getLiabilityMznMinor
} from "@/features/business-dashboard/model";

const business = {
  id: "business-1",
  name: "Mercado Central",
  slug: "mercado-central",
  status: "active",
  city: "Maputo"
};

const program = {
  name: "Pontos Mercado",
  status: "active",
  earnRate: "0.0500",
  pointValueMznMinor: 100,
  maximumRedemptionPercent: "50.00",
  pointsExpireAfterDays: 365
};

describe("business dashboard model", () => {
  it("formats dashboard money and percentages", () => {
    expect(formatMznMinor(12_505)).toBe("125,05 MZN");
    expect(formatPercent(0.375)).toBe("38%");
  });

  it("calculates liability from available points and configured point value", () => {
    expect(getLiabilityMznMinor(240, 100)).toBe(24_000);
    expect(getLiabilityMznMinor(-1, 100)).toBe(0);
  });

  it("builds overview, liability, redemption, and retention metrics", () => {
    const dashboard = buildBusinessDashboardViewModel({
      business,
      program,
      scopeLabel: "Todo o negócio",
      hasManagerScope: true,
      settings: {
        businessStatus: "active",
        programStatus: "active",
        subscriptionStatus: "trialing",
        activeOffers: 2
      },
      branches: [],
      campaigns: [],
      employees: [],
      customers: [
        {
          id: "card-1",
          customerName: "Ana Mucavele",
          cardNumber: "VY-111111",
          availablePoints: 120,
          lifetimeEarned: 200,
          lifetimeRedeemed: 80,
          liabilityMznMinor: 12_000,
          joinedAt: "2026-01-01T00:00:00.000Z",
          lastTransactionAt: "2026-02-01T00:00:00.000Z"
        },
        {
          id: "card-2",
          customerName: "Mateus Sitoe",
          cardNumber: "VY-222222",
          availablePoints: 40,
          lifetimeEarned: 50,
          lifetimeRedeemed: 10,
          liabilityMznMinor: 4_000,
          joinedAt: "2026-01-02T00:00:00.000Z",
          lastTransactionAt: null
        }
      ],
      transactions: [
        {
          id: "tx-1",
          customerCardId: "card-1",
          branchName: "Baixa",
          customerName: "Ana Mucavele",
          grossAmountMznMinor: 10_000,
          netAmountMznMinor: 10_000,
          pointsEarned: 5,
          pointsRedeemed: 0,
          occurredAt: "2026-02-01T00:00:00.000Z"
        },
        {
          id: "tx-2",
          customerCardId: "card-1",
          branchName: "Baixa",
          customerName: "Ana Mucavele",
          grossAmountMznMinor: 20_000,
          netAmountMznMinor: 18_000,
          pointsEarned: 9,
          pointsRedeemed: 2,
          occurredAt: "2026-02-02T00:00:00.000Z"
        }
      ]
    });

    expect(dashboard.overview.revenueMznMinor).toBe(28_000);
    expect(dashboard.overview.averageTicketMznMinor).toBe(14_000);
    expect(dashboard.points.liabilityMznMinor).toBe(16_000);
    expect(dashboard.points.redemptionRate).toBe(90 / 250);
    expect(dashboard.retention.retainedCustomerCount).toBe(1);
    expect(dashboard.retention.retentionRate).toBe(0.5);
  });
});
