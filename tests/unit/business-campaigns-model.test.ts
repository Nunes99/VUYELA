import { describe, expect, it } from "vitest";

import {
  buildCampaignAnalytics,
  buildSegmentKey,
  calculateCampaignEligibility,
  deriveCampaignStatus
} from "@/features/business-campaigns/model";
import type {
  BusinessCampaign,
  CampaignAudienceCriteria,
  CampaignEligibilityCustomer
} from "@/features/business-campaigns/model";

const customers: CampaignEligibilityCustomer[] = [
  {
    id: "card-1",
    customerName: "Ana Mucavele",
    purchaseCount: 0,
    totalSpentMznMinor: 0,
    lastPurchaseAt: null,
    tierName: null,
    pointsBalance: 20,
    city: "Maputo",
    hasMarketingConsent: true
  },
  {
    id: "card-2",
    customerName: "Mateus Sitoe",
    purchaseCount: 1,
    totalSpentMznMinor: 12_500,
    lastPurchaseAt: "2026-07-01T10:00:00.000Z",
    tierName: "VIP",
    pointsBalance: 240,
    city: "Matola",
    hasMarketingConsent: false
  },
  {
    id: "card-3",
    customerName: "Celina Cuambe",
    purchaseCount: 4,
    totalSpentMznMinor: 82_000,
    lastPurchaseAt: "2026-05-01T10:00:00.000Z",
    tierName: "VIP",
    pointsBalance: 780,
    city: "Maputo",
    hasMarketingConsent: true
  }
];

describe("business campaign model", () => {
  it("derives draft, scheduled, and active statuses from intent and dates", () => {
    const now = new Date("2026-08-17T10:00:00.000Z");

    expect(deriveCampaignStatus({ saveAsDraft: true, startsAt: null, now })).toBe("draft");
    expect(
      deriveCampaignStatus({ saveAsDraft: false, startsAt: "2026-08-18T10:00:00.000Z", now })
    ).toBe("scheduled");
    expect(
      deriveCampaignStatus({ saveAsDraft: false, startsAt: "2026-08-16T10:00:00.000Z", now })
    ).toBe("active");
  });

  it("calculates eligibility with campaign type presets and consent", () => {
    const audience: CampaignAudienceCriteria = {
      requiresMarketingConsent: true
    };
    const results = calculateCampaignEligibility({
      campaignType: "first_purchase",
      audience,
      customers,
      referenceAt: new Date("2026-08-17T10:00:00.000Z")
    });

    expect(results.filter((result) => result.eligible).map((result) => result.customerId)).toEqual([
      "card-1"
    ]);
    expect(results.find((result) => result.customerId === "card-2")?.reason).toBe(
      "Cliente já comprou"
    );
  });

  it("blocks marketing campaigns when consent is required", () => {
    const results = calculateCampaignEligibility({
      campaignType: "second_purchase",
      audience: {
        requiresMarketingConsent: true
      },
      customers,
      referenceAt: new Date("2026-08-17T10:00:00.000Z")
    });

    expect(results.find((result) => result.customerId === "card-2")).toMatchObject({
      eligible: false,
      consentBlocked: true,
      reason: "Consentimento de marketing em falta"
    });
  });

  it("supports rule-based audience segmentation", () => {
    const audience: CampaignAudienceCriteria = {
      city: "Maputo",
      minTotalSpentMznMinor: 50_000,
      minPointsBalance: 500,
      tierName: "VIP",
      requiresMarketingConsent: true
    };
    const results = calculateCampaignEligibility({
      campaignType: "vip",
      audience,
      customers,
      referenceAt: new Date("2026-08-17T10:00:00.000Z")
    });

    expect(results.filter((result) => result.eligible).map((result) => result.customerId)).toEqual([
      "card-3"
    ]);
    expect(buildSegmentKey("vip", audience)).toContain("city:maputo");
  });

  it("calculates campaign analytics from materialized audiences", () => {
    const campaigns: BusinessCampaign[] = [
      campaign({ id: "c1", status: "active", audienceCount: 10, consentedAudienceCount: 8 }),
      campaign({ id: "c2", status: "scheduled", audienceCount: 4, consentedAudienceCount: 2 }),
      campaign({ id: "c3", status: "draft", audienceCount: 0, consentedAudienceCount: 0 })
    ];

    expect(buildCampaignAnalytics(campaigns)).toMatchObject({
      totalCampaigns: 3,
      activeCampaigns: 1,
      scheduledCampaigns: 1,
      draftCampaigns: 1,
      totalAudienceCount: 14,
      consentedAudienceCount: 10,
      averageAudienceCount: 5,
      consentCoverageRate: 10 / 14,
      notificationCount: 18,
      queuedNotificationCount: 3,
      deliveredNotificationCount: 12,
      failedNotificationCount: 3
    });
  });
});

function campaign(
  overrides: Pick<BusinessCampaign, "id" | "status" | "audienceCount" | "consentedAudienceCount">
): BusinessCampaign {
  return {
    businessId: "business-1",
    name: "Campanha",
    campaignType: "vip",
    startsAt: null,
    endsAt: null,
    rules: {
      rewardType: "message_only",
      plannedChannel: "in_app",
      notificationSubject: "Novidade",
      notificationBody: "Temos uma novidade para si."
    },
    audience: {
      requiresMarketingConsent: false
    },
    createdAt: "2026-08-17T10:00:00.000Z",
    notificationCount: 6,
    queuedNotificationCount: 1,
    deliveredNotificationCount: 4,
    failedNotificationCount: 1,
    ...overrides
  };
}
