import { describe, expect, it } from "vitest";

import {
  calculateEarnedPoints,
  calculateMaximumRedeemablePoints,
  calculatePointValueMznMinor,
  calculateRedemption,
  DEFAULT_POINT_VALUE_MZN_MINOR
} from "@/lib/loyalty/engine";

describe("loyalty engine", () => {
  it("uses 1 point as 1 MZN promotional value by default", () => {
    expect(DEFAULT_POINT_VALUE_MZN_MINOR).toBe(100);
    expect(calculatePointValueMznMinor(75, DEFAULT_POINT_VALUE_MZN_MINOR)).toBe(7_500);
  });

  it("earns points from gross amount after discounts and redeemed value", () => {
    expect(
      calculateEarnedPoints({
        grossAmountMznMinor: 10_000,
        discountAmountMznMinor: 1_000,
        pointsRedeemedValueMznMinor: 2_000,
        earnRate: "0.0500"
      })
    ).toBe(3);
  });

  it("rounds earned points down and respects minimum earn amount", () => {
    expect(
      calculateEarnedPoints({
        grossAmountMznMinor: 9_999,
        earnRate: "0.0500"
      })
    ).toBe(4);

    expect(
      calculateEarnedPoints({
        grossAmountMznMinor: 9_999,
        earnRate: "0.0500",
        minimumEarnAmountMznMinor: 10_000
      })
    ).toBe(0);
  });

  it("caps redemption by configured percentage, purchase value, and wallet balance", () => {
    expect(
      calculateMaximumRedeemablePoints({
        grossAmountMznMinor: 20_000,
        discountAmountMznMinor: 2_000,
        availableBalance: 500,
        pointValueMznMinor: DEFAULT_POINT_VALUE_MZN_MINOR,
        maximumRedemptionPercent: "50.00"
      })
    ).toBe(90);
  });

  it("rejects redemption requests above the atomic maximum", () => {
    expect(() =>
      calculateRedemption({
        grossAmountMznMinor: 10_000,
        requestedPoints: 101,
        availableBalance: 500,
        pointValueMznMinor: DEFAULT_POINT_VALUE_MZN_MINOR,
        maximumRedemptionPercent: "100.00"
      })
    ).toThrow("requestedPoints exceeds maximum redeemable points");
  });

  it("returns redemption value and resulting net amount", () => {
    expect(
      calculateRedemption({
        grossAmountMznMinor: 10_000,
        discountAmountMznMinor: 1_000,
        requestedPoints: 25,
        availableBalance: 100,
        pointValueMznMinor: DEFAULT_POINT_VALUE_MZN_MINOR,
        maximumRedemptionPercent: "100.00"
      })
    ).toEqual({
      pointsRedeemed: 25,
      pointsRedeemedValueMznMinor: 2_500,
      netAmountMznMinor: 6_500,
      maximumRedeemablePoints: 90
    });
  });

  it("rejects invalid decimal and money inputs", () => {
    expect(() =>
      calculateEarnedPoints({
        grossAmountMznMinor: 10_000,
        earnRate: "0.05%"
      })
    ).toThrow("earnRate must be a non-negative decimal string");

    expect(() =>
      calculateMaximumRedeemablePoints({
        grossAmountMznMinor: -1,
        availableBalance: 10,
        pointValueMznMinor: DEFAULT_POINT_VALUE_MZN_MINOR,
        maximumRedemptionPercent: "100.00"
      })
    ).toThrow("grossAmountMznMinor must be a non-negative integer");

    expect(() =>
      calculatePointValueMznMinor(Number.MAX_SAFE_INTEGER + 1, DEFAULT_POINT_VALUE_MZN_MINOR)
    ).toThrow("points must be a non-negative integer");
  });
});
