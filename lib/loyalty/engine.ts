export const DEFAULT_POINT_VALUE_MZN_MINOR = 100;
export const PERCENT_BASIS_POINTS = 10_000;
export const MZN_MINOR_UNITS_PER_MZN = 100;

export type EarnInput = {
  grossAmountMznMinor: number;
  discountAmountMznMinor?: number;
  pointsRedeemedValueMznMinor?: number;
  earnRate: string;
  minimumEarnAmountMznMinor?: number;
};

export type RedemptionInput = {
  grossAmountMznMinor: number;
  discountAmountMznMinor?: number;
  requestedPoints: number;
  availableBalance: number;
  pointValueMznMinor: number;
  maximumRedemptionPercent: string;
};

export type RedemptionResult = {
  pointsRedeemed: number;
  pointsRedeemedValueMznMinor: number;
  netAmountMznMinor: number;
  maximumRedeemablePoints: number;
};

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export function calculateEligibleAmountMznMinor({
  grossAmountMznMinor,
  discountAmountMznMinor = 0,
  pointsRedeemedValueMznMinor = 0
}: Pick<
  EarnInput,
  "grossAmountMznMinor" | "discountAmountMznMinor" | "pointsRedeemedValueMznMinor"
>): number {
  assertMinorUnits("grossAmountMznMinor", grossAmountMznMinor);
  assertMinorUnits("discountAmountMznMinor", discountAmountMznMinor);
  assertMinorUnits("pointsRedeemedValueMznMinor", pointsRedeemedValueMznMinor);

  const eligibleAmount = grossAmountMznMinor - discountAmountMznMinor - pointsRedeemedValueMznMinor;

  return Math.max(eligibleAmount, 0);
}

export function calculateEarnedPoints({
  grossAmountMznMinor,
  discountAmountMznMinor = 0,
  pointsRedeemedValueMznMinor = 0,
  earnRate,
  minimumEarnAmountMznMinor = 0
}: EarnInput): number {
  assertMinorUnits("minimumEarnAmountMznMinor", minimumEarnAmountMznMinor);

  const eligibleAmountMznMinor = calculateEligibleAmountMznMinor({
    grossAmountMznMinor,
    discountAmountMznMinor,
    pointsRedeemedValueMznMinor
  });

  if (eligibleAmountMznMinor < minimumEarnAmountMznMinor) {
    return 0;
  }

  const earnRateBasisPoints = parseDecimalToBasisPoints("earnRate", earnRate);

  return Math.floor(
    (eligibleAmountMznMinor * earnRateBasisPoints) /
      (MZN_MINOR_UNITS_PER_MZN * PERCENT_BASIS_POINTS)
  );
}

export function calculatePointValueMznMinor(points: number, pointValueMznMinor: number): number {
  assertPoints("points", points);
  assertPositiveInteger("pointValueMznMinor", pointValueMznMinor);

  return points * pointValueMznMinor;
}

export function calculateMaximumRedeemablePoints({
  grossAmountMznMinor,
  discountAmountMznMinor = 0,
  availableBalance,
  pointValueMznMinor,
  maximumRedemptionPercent
}: Omit<RedemptionInput, "requestedPoints">): number {
  assertMinorUnits("grossAmountMznMinor", grossAmountMznMinor);
  assertMinorUnits("discountAmountMznMinor", discountAmountMznMinor);
  assertPoints("availableBalance", availableBalance);
  assertPositiveInteger("pointValueMznMinor", pointValueMznMinor);

  const maximumRedemptionBasisPoints = parsePercentToBasisPoints(
    "maximumRedemptionPercent",
    maximumRedemptionPercent
  );
  const amountAfterDiscountMznMinor = Math.max(grossAmountMznMinor - discountAmountMznMinor, 0);
  const maximumValueMznMinor = Math.floor(
    (amountAfterDiscountMznMinor * maximumRedemptionBasisPoints) / PERCENT_BASIS_POINTS
  );
  const pointsByValue = Math.floor(maximumValueMznMinor / pointValueMznMinor);

  return Math.min(availableBalance, pointsByValue);
}

export function calculateRedemption(input: RedemptionInput): RedemptionResult {
  assertPositiveInteger("requestedPoints", input.requestedPoints);

  const maximumRedeemablePoints = calculateMaximumRedeemablePoints(input);

  if (input.requestedPoints > maximumRedeemablePoints) {
    throw new RangeError("requestedPoints exceeds maximum redeemable points");
  }

  const pointsRedeemedValueMznMinor = calculatePointValueMznMinor(
    input.requestedPoints,
    input.pointValueMznMinor
  );
  const netAmountMznMinor = calculateEligibleAmountMznMinor({
    grossAmountMznMinor: input.grossAmountMznMinor,
    discountAmountMznMinor: input.discountAmountMznMinor,
    pointsRedeemedValueMznMinor
  });

  return {
    pointsRedeemed: input.requestedPoints,
    pointsRedeemedValueMznMinor,
    netAmountMznMinor,
    maximumRedeemablePoints
  };
}

function parseDecimalToBasisPoints(fieldName: string, value: string): number {
  const normalizedValue = value.trim();

  if (!DECIMAL_PATTERN.test(normalizedValue)) {
    throw new RangeError(`${fieldName} must be a non-negative decimal string`);
  }

  const [integerPart, decimalPart = ""] = normalizedValue.split(".");

  if (decimalPart.length > 4) {
    throw new RangeError(`${fieldName} cannot have more than 4 decimal places`);
  }

  const paddedDecimal = decimalPart.padEnd(4, "0").slice(0, 4);

  return Number(integerPart) * PERCENT_BASIS_POINTS + Number(paddedDecimal);
}

function parsePercentToBasisPoints(fieldName: string, value: string): number {
  const normalizedValue = value.trim();

  if (!DECIMAL_PATTERN.test(normalizedValue)) {
    throw new RangeError(`${fieldName} must be a non-negative decimal string`);
  }

  const [integerPart, decimalPart = ""] = normalizedValue.split(".");

  if (decimalPart.length > 2) {
    throw new RangeError(`${fieldName} cannot have more than 2 decimal places`);
  }

  const basisPoints = Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0"));

  if (basisPoints > PERCENT_BASIS_POINTS) {
    throw new RangeError(`${fieldName} cannot exceed 100`);
  }

  return basisPoints;
}

function assertMinorUnits(fieldName: string, value: number): void {
  assertNonNegativeInteger(fieldName, value);
}

function assertPoints(fieldName: string, value: number): void {
  assertNonNegativeInteger(fieldName, value);
}

function assertPositiveInteger(fieldName: string, value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${fieldName} must be a positive integer`);
  }
}

function assertNonNegativeInteger(fieldName: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${fieldName} must be a non-negative integer`);
  }
}
