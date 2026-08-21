import { describe, expect, it } from "vitest";

import {
  createOfflineCardPayload,
  offlineCardPayloadVersion,
  parseOfflineCardPayload
} from "@/features/pwa/model";

describe("PWA offline card model", () => {
  it("stores identification only without balances or customer profile data", () => {
    const payload = createOfflineCardPayload(
      [
        {
          id: "card-1",
          businessId: "business-1",
          businessName: "Cafe Central",
          cardNumber: "VY-0001",
          qrCode: "VUYELA:CARD:business-1:VY-0001"
        }
      ],
      "2026-08-21T10:00:00.000Z"
    );

    expect(payload).toEqual({
      version: offlineCardPayloadVersion,
      updatedAt: "2026-08-21T10:00:00.000Z",
      cards: [
        {
          id: "card-1",
          businessId: "business-1",
          businessName: "Cafe Central",
          cardNumber: "VY-0001",
          qrCode: "VUYELA:CARD:business-1:VY-0001"
        }
      ]
    });
    expect(JSON.stringify(payload)).not.toMatch(/balance|points|mzn|customerName/i);
  });

  it("rejects incompatible versions and QR codes outside the business scope", () => {
    expect(parseOfflineCardPayload({ version: 2, updatedAt: "now", cards: [] })).toBeNull();

    expect(
      parseOfflineCardPayload({
        version: 1,
        updatedAt: "2026-08-21T10:00:00.000Z",
        cards: [
          {
            id: "card-1",
            businessId: "business-1",
            businessName: "Cafe Central",
            cardNumber: "VY-0001",
            qrCode: "VUYELA:CARD:another-business:VY-0001"
          }
        ]
      })
    ).toEqual({
      version: 1,
      updatedAt: "2026-08-21T10:00:00.000Z",
      cards: []
    });
  });
});
