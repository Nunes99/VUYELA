import { describe, expect, it } from "vitest";

import {
  formatEntitlementLimit,
  getAnalyticsLabel,
  getFeatureLabel,
  getUsageRatio,
  parseBusinessSubscriptionOverview
} from "@/features/subscriptions/model";

describe("subscription model", () => {
  it("parses the subscription, entitlements, usage, and available plans", () => {
    const overview = parseBusinessSubscriptionOverview({
      businessId: "business-1",
      subscription: {
        id: "subscription-1",
        status: "active",
        currentPeriodStart: "2026-08-01T00:00:00.000Z",
        currentPeriodEnd: "2026-09-01T00:00:00.000Z",
        trialEndsAt: null,
        plan: {
          id: "plan-1",
          slug: "essencial",
          name: "Essencial",
          description: "Plano essencial",
          monthlyPriceMznMinor: 150000
        }
      },
      entitlements: {
        branchLimit: 2,
        staffLimit: 8,
        campaignLimit: 5,
        analyticsLevel: "basic",
        featureFlags: ["loyalty", "campaign_delivery"]
      },
      usage: { branches: 1, staff: 3, campaigns: 2 },
      availablePlans: [
        {
          id: "plan-1",
          slug: "essencial",
          name: "Essencial",
          description: "Plano essencial",
          monthlyPriceMznMinor: 150000,
          trialDays: 14,
          branchLimit: 2,
          staffLimit: 8,
          campaignLimit: 5,
          analyticsLevel: "basic",
          featureFlags: ["loyalty"]
        }
      ]
    });

    expect(overview).toMatchObject({
      businessId: "business-1",
      subscription: { status: "active", plan: { slug: "essencial" } },
      entitlements: { campaignLimit: 5 },
      usage: { campaigns: 2 }
    });
    expect(overview?.availablePlans).toHaveLength(1);
  });

  it("accepts an explicit empty subscription state without inventing entitlements", () => {
    expect(
      parseBusinessSubscriptionOverview({
        businessId: "business-1",
        subscription: null,
        entitlements: null,
        usage: { branches: 1, staff: 1, campaigns: 0 },
        availablePlans: []
      })
    ).toMatchObject({ subscription: null, entitlements: null });
  });

  it("formats limits, usage, analytics, and feature labels", () => {
    expect(formatEntitlementLimit(null)).toBe("Ilimitado");
    expect(getUsageRatio(3, 5)).toBe(0.6);
    expect(getUsageRatio(8, 5)).toBe(1);
    expect(getUsageRatio(8, null)).toBe(0);
    expect(getAnalyticsLabel("advanced")).toBe("Avançada");
    expect(getFeatureLabel("campaign_delivery")).toBe("Envio de campanhas");
  });
});
