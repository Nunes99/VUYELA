import {
  calculateEarnedPoints,
  calculateMaximumRedeemablePoints,
  calculatePointValueMznMinor
} from "@/lib/loyalty/engine";

export interface PosCustomerCard {
  customerCardId: string;
  customerName: string;
  cardNumber: string;
  availablePoints: number;
  pointValueMznMinor: number;
  maximumRedemptionPercent: string;
  earnRate: string;
}

export interface PosQuoteInput {
  grossAmountMznMinor: number;
  discountAmountMznMinor: number;
  requestedPointsToRedeem: number;
  card: PosCustomerCard;
}

export interface PosQuote {
  grossAmountMznMinor: number;
  discountAmountMznMinor: number;
  pointsToRedeem: number;
  pointsRedeemedValueMznMinor: number;
  maximumRedeemablePoints: number;
  pointsEarned: number;
  netAmountMznMinor: number;
}

export type PosLookupMethod = "qr" | "card" | "phone";
export type PosPaymentMethod = "mpesa" | "emola" | "mkesh" | "cash" | "card";

export interface NormalizedPosLookup {
  method: PosLookupMethod;
  value: string;
}

export type PosStepId = "identify" | "services" | "authorize" | "confirm" | "success";

export const posSteps: ReadonlyArray<{ id: PosStepId; label: string }> = [
  { id: "identify", label: "Identificar" },
  { id: "services", label: "Serviços" },
  { id: "authorize", label: "Autorizar" },
  { id: "confirm", label: "Confirmar" },
  { id: "success", label: "Sucesso" }
];

export function isPosPaymentMethod(value: string): value is PosPaymentMethod {
  return (
    value === "mpesa" ||
    value === "emola" ||
    value === "mkesh" ||
    value === "cash" ||
    value === "card"
  );
}

export function isAvailablePosPaymentMethod(
  value: PosPaymentMethod
): value is Extract<PosPaymentMethod, "cash" | "card"> {
  return value === "cash" || value === "card";
}

const MONEY_PATTERN = /^\d+(?:[,.]\d{1,2})?$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9_-]{12,80}$/;
const CARD_NUMBER_PATTERN = /^VY-[0-9A-Z-]{6,32}$/;

export function normalizePosCustomerLookup(
  method: PosLookupMethod,
  value: string
): NormalizedPosLookup {
  const normalizedValue = value.trim();

  if (method !== "qr") {
    return {
      method,
      value: method === "card" ? normalizedValue.toUpperCase() : normalizedValue
    };
  }

  const upperValue = normalizedValue.toUpperCase();

  if (CARD_NUMBER_PATTERN.test(upperValue)) {
    return { method: "card", value: upperValue };
  }

  return { method: "qr", value: normalizedValue };
}

export function parseMznToMinorUnits(value: string): number {
  const normalized = value.trim().replace(",", ".");

  if (!MONEY_PATTERN.test(normalized)) {
    throw new RangeError("MZN amount must use up to two decimal places");
  }

  const [mznPart, centsPart = ""] = normalized.split(".");

  return Number(mznPart) * 100 + Number(centsPart.padEnd(2, "0"));
}

export function formatMznMinor(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("MZN minor value must be a non-negative integer");
  }

  return `${Math.floor(value / 100).toLocaleString("pt-MZ")},${String(value % 100).padStart(
    2,
    "0"
  )} MZN`;
}

export function buildPosQuote({
  grossAmountMznMinor,
  discountAmountMznMinor,
  requestedPointsToRedeem,
  card
}: PosQuoteInput): PosQuote {
  const maximumRedeemablePoints = calculateMaximumRedeemablePoints({
    grossAmountMznMinor,
    discountAmountMznMinor,
    availableBalance: card.availablePoints,
    pointValueMznMinor: card.pointValueMznMinor,
    maximumRedemptionPercent: card.maximumRedemptionPercent
  });
  const pointsToRedeem = Math.min(requestedPointsToRedeem, maximumRedeemablePoints);
  const pointsRedeemedValueMznMinor = calculatePointValueMznMinor(
    pointsToRedeem,
    card.pointValueMznMinor
  );
  const netAmountMznMinor =
    grossAmountMznMinor - discountAmountMznMinor - pointsRedeemedValueMznMinor;
  const pointsEarned = calculateEarnedPoints({
    grossAmountMznMinor,
    discountAmountMznMinor,
    pointsRedeemedValueMznMinor,
    earnRate: card.earnRate
  });

  return {
    grossAmountMznMinor,
    discountAmountMznMinor,
    pointsToRedeem,
    pointsRedeemedValueMznMinor,
    maximumRedeemablePoints,
    pointsEarned,
    netAmountMznMinor
  };
}

export function isValidIdempotencyKey(value: string): boolean {
  return IDEMPOTENCY_PATTERN.test(value);
}

export function buildFallbackIdempotencyKey(parts: {
  businessId: string;
  branchId: string;
  customerCardId: string;
  grossAmountMznMinor: number;
  pointsToRedeem: number;
}): string {
  const raw = [
    parts.businessId,
    parts.branchId || "business",
    parts.customerCardId,
    parts.grossAmountMznMinor,
    parts.pointsToRedeem
  ].join(":");

  return `pos_${stableHash(raw)}_${parts.grossAmountMznMinor}_${parts.pointsToRedeem}`;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36).padStart(7, "0");
}
