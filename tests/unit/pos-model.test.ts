import { describe, expect, it } from "vitest";

import {
  buildFallbackIdempotencyKey,
  buildPosQuote,
  formatMznMinor,
  isValidIdempotencyKey,
  normalizePosCustomerLookup,
  parseMznToMinorUnits
} from "@/features/pos/model";

const card = {
  customerCardId: "card-1",
  customerName: "Ana Mucavele",
  cardNumber: "VY-8F2K-91M",
  availablePoints: 120,
  pointValueMznMinor: 100,
  maximumRedemptionPercent: "50.00",
  earnRate: "0.0500"
};

describe("POS model", () => {
  it("parses and formats MZN minor units", () => {
    expect(parseMznToMinorUnits("125")).toBe(12_500);
    expect(parseMznToMinorUnits("125,50")).toBe(12_550);
    expect(parseMznToMinorUnits("125.05")).toBe(12_505);
    expect(formatMznMinor(12_505)).toBe("125,05 MZN");
  });

  it("builds a POS quote with capped redemption and earned points", () => {
    expect(
      buildPosQuote({
        grossAmountMznMinor: 20_000,
        discountAmountMznMinor: 0,
        requestedPointsToRedeem: 120,
        card
      })
    ).toEqual({
      grossAmountMznMinor: 20_000,
      discountAmountMznMinor: 0,
      pointsToRedeem: 100,
      pointsRedeemedValueMznMinor: 10_000,
      maximumRedeemablePoints: 100,
      pointsEarned: 5,
      netAmountMznMinor: 10_000
    });
  });

  it("validates and builds duplicate-submission keys", () => {
    expect(isValidIdempotencyKey("pos_1234567890ab")).toBe(true);
    expect(isValidIdempotencyKey("short")).toBe(false);

    const key = buildFallbackIdempotencyKey({
      businessId: "6ab0d80e-e6f2-4ad2-b747-75876d1c70ba",
      branchId: "0441ff78-b017-4679-846e-08e308623758",
      customerCardId: "7fd6e6cd-51dd-44cc-9bbe-72a331972c5e",
      grossAmountMznMinor: 20_000,
      pointsToRedeem: 10
    });

    expect(isValidIdempotencyKey(key)).toBe(true);
    expect(key.length).toBeLessThanOrEqual(80);
    expect(key).toBe(
      buildFallbackIdempotencyKey({
        businessId: "6ab0d80e-e6f2-4ad2-b747-75876d1c70ba",
        branchId: "0441ff78-b017-4679-846e-08e308623758",
        customerCardId: "7fd6e6cd-51dd-44cc-9bbe-72a331972c5e",
        grossAmountMznMinor: 20_000,
        pointsToRedeem: 10
      })
    );
  });

  it("accepts compact card QR payloads while preserving legacy QR payloads", () => {
    expect(normalizePosCustomerLookup("qr", " vy-8f2k-91m ")).toEqual({
      method: "card",
      value: "VY-8F2K-91M"
    });
    expect(
      normalizePosCustomerLookup(
        "qr",
        "VUYELA:CARD:6ab0d80e-e6f2-4ad2-b747-75876d1c70ba:VY-8F2K-91M"
      )
    ).toEqual({
      method: "qr",
      value: "VUYELA:CARD:6ab0d80e-e6f2-4ad2-b747-75876d1c70ba:VY-8F2K-91M"
    });
  });
});
