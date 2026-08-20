import { describe, expect, it } from "vitest";

import {
  buildBusinessReferralSummary,
  buildReferralSummary,
  calculatePointsValueMznMinor,
  getEffectiveReferralStatus,
  getReferralStatusLabel
} from "@/features/referrals/model";
import type { ReferralHistoryItem } from "@/features/referrals/model";

describe("referral model", () => {
  it("derives expired invitations without changing persisted history", () => {
    expect(
      getEffectiveReferralStatus(
        "pending",
        "2026-08-19T10:00:00.000Z",
        new Date("2026-08-20T10:00:00.000Z")
      )
    ).toBe("expired");
    expect(
      getEffectiveReferralStatus(
        "accepted",
        "2026-08-19T10:00:00.000Z",
        new Date("2026-08-20T10:00:00.000Z")
      )
    ).toBe("accepted");
    expect(getReferralStatusLabel("rewarded")).toBe("Premiada");
  });

  it("calculates promotional value using integer minor units", () => {
    expect(calculatePointsValueMznMinor(250, 50)).toBe(12_500);
    expect(calculatePointsValueMznMinor(-1, 50)).toBe(0);
  });

  it("summarizes only the reward received by the current customer", () => {
    const items = [
      referral({ id: "one", role: "referrer", referrerRewardPoints: 500 }),
      referral({ id: "two", role: "referred", referredRewardPoints: 250 }),
      referral({ id: "three", status: "accepted" })
    ];

    expect(buildReferralSummary(items)).toEqual({
      pendingCount: 0,
      acceptedCount: 1,
      rewardedCount: 2,
      totalRewardPoints: 750,
      totalRewardValueMznMinor: 75_000
    });
  });

  it("summarizes both issued rewards for the business", () => {
    const items = [
      referral({ id: "one", referrerRewardPoints: 500, referredRewardPoints: 250 }),
      referral({ id: "two", status: "blocked" }),
      referral({ id: "three", status: "pending" })
    ];

    expect(buildBusinessReferralSummary(items, 2)).toEqual({
      pendingCount: 1,
      acceptedCount: 0,
      rewardedCount: 1,
      blockedCount: 1,
      totalIssuedPoints: 750,
      totalIssuedValueMznMinor: 75_000,
      fraudEventCount: 2
    });
  });
});

function referral(overrides: Partial<ReferralHistoryItem>): ReferralHistoryItem {
  return {
    id: "referral",
    businessId: "business",
    businessName: "Loja",
    referrerCardId: "referrer-card",
    referredCardId: "referred-card",
    referralCode: "VY-12AB34CD",
    status: "rewarded",
    role: "referrer",
    referrerRewardPoints: 100,
    referredRewardPoints: 50,
    pointValueMznMinor: 100,
    createdAt: "2026-08-20T10:00:00.000Z",
    expiresAt: "2026-09-03T10:00:00.000Z",
    acceptedAt: "2026-08-20T11:00:00.000Z",
    rewardedAt: "2026-08-21T10:00:00.000Z",
    blockedReason: null,
    ...overrides
  };
}
