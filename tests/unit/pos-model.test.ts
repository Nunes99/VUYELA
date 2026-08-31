import { describe, expect, it } from "vitest";

import {
  buildFallbackIdempotencyKey,
  formatMznCompact,
  formatMznMinor,
  isValidIdempotencyKey,
  normalizeCartItems,
  normalizePosCustomerLookup,
  parseMznToMinorUnits,
  parsePosQuote,
  splitVatInclusive
} from "@/features/pos/model";
import {
  attemptIdFromMpesaReference,
  formatMpesaAmount,
  mpesaAttemptReference,
  normalizeMpesaMsisdn,
  parseMpesaProviderResponse
} from "@/features/payments/mpesa/model";

describe("POS model", () => {
  it("parses and formats MZN minor units", () => {
    expect(parseMznToMinorUnits("125")).toBe(12_500);
    expect(parseMznToMinorUnits("125,50")).toBe(12_550);
    expect(parseMznToMinorUnits("125.05")).toBe(12_505);
    expect(formatMznMinor(12_505)).toBe("125,05 MZN");
    expect(formatMznCompact(140_000)).toBe("1.400 MZN");
  });

  it("splits an IVA-inclusive total without losing minor units", () => {
    expect(splitVatInclusive(140_000)).toEqual({
      subtotalMznMinor: 120_690,
      vatMznMinor: 19_310
    });
  });

  it("normalizes duplicate cart lines while preserving quantities", () => {
    expect(
      normalizeCartItems([
        { catalogItemId: "item-1", quantity: 1 },
        { catalogItemId: "item-2", quantity: 2 },
        { catalogItemId: "item-1", quantity: 3 }
      ])
    ).toEqual([
      { catalogItemId: "item-1", quantity: 4 },
      { catalogItemId: "item-2", quantity: 2 }
    ]);
    expect(() => normalizeCartItems([])).toThrow();
    expect(() => normalizeCartItems([{ catalogItemId: "item-1", quantity: 0 }])).toThrow();
  });

  it("validates a server quote and its arithmetic", () => {
    expect(
      parsePosQuote({
        lines: [
          {
            catalogItemId: "item-1",
            sku: "SKU-1",
            name: "Corte",
            description: null,
            quantity: 2,
            unitPriceMznMinor: 10_000,
            grossAmountMznMinor: 20_000,
            loyaltyDiscountPercent: 10,
            discountAmountMznMinor: 2_000,
            netAmountMznMinor: 18_000
          }
        ],
        grossAmountMznMinor: 20_000,
        discountAmountMznMinor: 2_000,
        availableBalance: 120,
        maximumRedeemablePoints: 90,
        pointsToRedeem: 50,
        pointsRedeemedValueMznMinor: 5_000,
        pointsEarned: 6,
        netAmountMznMinor: 13_000
      })
    ).toMatchObject({ netAmountMznMinor: 13_000, pointsEarned: 6 });

    expect(() =>
      parsePosQuote({
        lines: [],
        grossAmountMznMinor: 100,
        discountAmountMznMinor: 0,
        availableBalance: 0,
        maximumRedeemablePoints: 0,
        pointsToRedeem: 0,
        pointsRedeemedValueMznMinor: 0,
        pointsEarned: 0,
        netAmountMznMinor: 100
      })
    ).toThrow();
  });

  it("validates and builds deterministic duplicate-submission keys for a cart", () => {
    expect(isValidIdempotencyKey("pos_1234567890ab")).toBe(true);
    expect(isValidIdempotencyKey("short")).toBe(false);

    const input = {
      businessId: "6ab0d80e-e6f2-4ad2-b747-75876d1c70ba",
      branchId: "0441ff78-b017-4679-846e-08e308623758",
      terminalId: "0baf4133-c8df-4af0-9ad5-50d1af8bff43",
      customerCardId: "7fd6e6cd-51dd-44cc-9bbe-72a331972c5e",
      cart: [{ catalogItemId: "1a9cdb03-8b4a-4c4f-88eb-4723008eeb91", quantity: 2 }],
      netAmountMznMinor: 20_000,
      pointsToRedeem: 10
    };
    const key = buildFallbackIdempotencyKey(input);

    expect(isValidIdempotencyKey(key)).toBe(true);
    expect(key.length).toBeLessThanOrEqual(80);
    expect(key).toBe(buildFallbackIdempotencyKey(input));
  });

  it("accepts compact card QR payloads while preserving signed QR payloads", () => {
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

  it("normalizes Mozambican Vodacom numbers for M-Pesa", () => {
    expect(normalizeMpesaMsisdn("+258 84 123 4567")).toBe("258841234567");
    expect(normalizeMpesaMsisdn("85 987 6543")).toBe("258859876543");
    expect(() => normalizeMpesaMsisdn("82 123 4567")).toThrow(/Vodacom/);
    expect(formatMpesaAmount(12_505)).toBe("125.05");
  });

  it("keeps the M-Pesa third-party reference reversible and maps provider results", () => {
    const attemptId = "6ab0d80e-e6f2-4ad2-b747-75876d1c70ba";
    const reference = mpesaAttemptReference(attemptId);

    expect(attemptIdFromMpesaReference(reference)).toBe(attemptId);
    expect(
      parseMpesaProviderResponse(
        {
          output_ResponseCode: "INS-0",
          output_ResponseDesc: "Request processed successfully",
          output_TransactionID: "49XKD31",
          output_ConversationID: "AG_20260829_01"
        },
        200
      )
    ).toMatchObject({
      status: "authorized",
      providerReference: "49XKD31",
      conversationId: "AG_20260829_01"
    });
  });
});
