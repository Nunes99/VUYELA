export interface PosCustomerCard {
  customerCardId: string;
  customerName: string;
  cardNumber: string;
  availablePoints: number;
  pointValueMznMinor: number;
  maximumRedemptionPercent: string;
  earnRate: string;
}

export interface PosCartItemInput {
  catalogItemId: string;
  quantity: number;
}

export interface PosQuoteLine {
  catalogItemId: string;
  sku: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitPriceMznMinor: number;
  grossAmountMznMinor: number;
  loyaltyDiscountPercent: number;
  discountAmountMznMinor: number;
  netAmountMznMinor: number;
}

export interface PosQuote {
  lines: PosQuoteLine[];
  grossAmountMznMinor: number;
  discountAmountMznMinor: number;
  availableBalance: number;
  maximumRedeemablePoints: number;
  pointsToRedeem: number;
  pointsRedeemedValueMznMinor: number;
  pointsEarned: number;
  netAmountMznMinor: number;
}

export type PosLookupMethod = "qr" | "card" | "phone";
export type PosPaymentMethod = "mpesa" | "emola" | "mkesh" | "cash" | "card" | "points";

export interface NormalizedPosLookup {
  method: PosLookupMethod;
  value: string;
}

export type PosStepId = "sale" | "benefits" | "payment" | "success";

export const posSteps: ReadonlyArray<{ id: PosStepId; label: string }> = [
  { id: "sale", label: "Venda" },
  { id: "benefits", label: "Benefícios" },
  { id: "payment", label: "Pagamento" },
  { id: "success", label: "Concluído" }
];

export function isPosPaymentMethod(value: string): value is PosPaymentMethod {
  return (
    value === "mpesa" ||
    value === "emola" ||
    value === "mkesh" ||
    value === "cash" ||
    value === "card" ||
    value === "points"
  );
}

export function isAvailablePosPaymentMethod(
  value: PosPaymentMethod
): value is Extract<PosPaymentMethod, "cash" | "card" | "mpesa" | "points"> {
  return value === "cash" || value === "card" || value === "mpesa" || value === "points";
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

export function formatMznCompact(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("MZN minor value must be a non-negative integer");
  }

  const major = String(Math.floor(value / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const minor = value % 100;

  return `${major}${minor === 0 ? "" : `,${String(minor).padStart(2, "0")}`} MZN`;
}

export function splitVatInclusive(value: number, vatPercent = 16) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("MZN minor value must be a non-negative integer");
  }

  if (!Number.isFinite(vatPercent) || vatPercent < 0) {
    throw new RangeError("VAT percentage must be non-negative");
  }

  const subtotalMznMinor = Math.round((value * 100) / (100 + vatPercent));

  return {
    subtotalMznMinor,
    vatMznMinor: value - subtotalMznMinor
  };
}

export function normalizeCartItems(value: unknown): PosCartItemInput[] {
  if (!Array.isArray(value)) {
    throw new RangeError("POS cart must be an array");
  }

  const quantities = new Map<string, number>();

  for (const item of value) {
    if (!isRecord(item)) {
      throw new RangeError("POS cart line must be an object");
    }

    const catalogItemId = typeof item.catalogItemId === "string" ? item.catalogItemId.trim() : "";
    const quantity = Number(item.quantity);

    if (!catalogItemId || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 999) {
      throw new RangeError("POS cart line is invalid");
    }

    const nextQuantity = (quantities.get(catalogItemId) ?? 0) + quantity;
    if (nextQuantity > 999) {
      throw new RangeError("POS cart item quantity is too high");
    }

    quantities.set(catalogItemId, nextQuantity);
  }

  if (quantities.size === 0 || quantities.size > 100) {
    throw new RangeError("POS cart must contain between 1 and 100 items");
  }

  return [...quantities].map(([catalogItemId, quantity]) => ({ catalogItemId, quantity }));
}

export function parsePosQuote(value: unknown): PosQuote {
  if (!isRecord(value) || !Array.isArray(value.lines)) {
    throw new RangeError("Invalid POS quote");
  }

  const quote: PosQuote = {
    lines: value.lines.map(parsePosQuoteLine),
    grossAmountMznMinor: nonNegativeInteger(value.grossAmountMznMinor),
    discountAmountMznMinor: nonNegativeInteger(value.discountAmountMznMinor),
    availableBalance: nonNegativeInteger(value.availableBalance),
    maximumRedeemablePoints: nonNegativeInteger(value.maximumRedeemablePoints),
    pointsToRedeem: nonNegativeInteger(value.pointsToRedeem),
    pointsRedeemedValueMznMinor: nonNegativeInteger(value.pointsRedeemedValueMznMinor),
    pointsEarned: nonNegativeInteger(value.pointsEarned),
    netAmountMznMinor: nonNegativeInteger(value.netAmountMznMinor)
  };

  if (
    quote.lines.length === 0 ||
    quote.netAmountMznMinor !==
      quote.grossAmountMznMinor - quote.discountAmountMznMinor - quote.pointsRedeemedValueMznMinor
  ) {
    throw new RangeError("Inconsistent POS quote");
  }

  return quote;
}

function parsePosQuoteLine(value: unknown): PosQuoteLine {
  if (!isRecord(value)) {
    throw new RangeError("Invalid POS quote line");
  }

  const line: PosQuoteLine = {
    catalogItemId: requiredString(value.catalogItemId),
    sku: optionalString(value.sku),
    name: requiredString(value.name),
    description: optionalString(value.description),
    quantity: positiveInteger(value.quantity),
    unitPriceMznMinor: nonNegativeInteger(value.unitPriceMznMinor),
    grossAmountMznMinor: nonNegativeInteger(value.grossAmountMznMinor),
    loyaltyDiscountPercent: percentage(value.loyaltyDiscountPercent),
    discountAmountMznMinor: nonNegativeInteger(value.discountAmountMznMinor),
    netAmountMznMinor: nonNegativeInteger(value.netAmountMznMinor)
  };

  if (
    line.grossAmountMznMinor !== line.unitPriceMznMinor * line.quantity ||
    line.netAmountMznMinor !== line.grossAmountMznMinor - line.discountAmountMznMinor
  ) {
    throw new RangeError("Inconsistent POS quote line");
  }

  return line;
}

export function isValidIdempotencyKey(value: string): boolean {
  return IDEMPOTENCY_PATTERN.test(value);
}

export function buildFallbackIdempotencyKey(parts: {
  businessId: string;
  branchId: string;
  terminalId: string;
  customerCardId: string | null;
  cart: PosCartItemInput[];
  netAmountMznMinor: number;
  pointsToRedeem: number;
}): string {
  const cartSignature = [...parts.cart]
    .sort((left, right) => left.catalogItemId.localeCompare(right.catalogItemId))
    .map((item) => `${item.catalogItemId}:${item.quantity}`)
    .join("|");
  const raw = [
    parts.businessId,
    parts.branchId,
    parts.terminalId,
    parts.customerCardId ?? "guest",
    cartSignature,
    parts.netAmountMznMinor,
    parts.pointsToRedeem
  ].join(":");

  return `pos_${stableHash(raw)}_${parts.netAmountMznMinor}_${parts.pointsToRedeem}`;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36).padStart(7, "0");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeInteger(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new RangeError("Expected a non-negative integer");
  }

  return parsed;
}

function positiveInteger(value: unknown): number {
  const parsed = nonNegativeInteger(value);

  if (parsed === 0) {
    throw new RangeError("Expected a positive integer");
  }

  return parsed;
}

function percentage(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new RangeError("Expected a percentage");
  }

  return parsed;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new RangeError("Expected a string");
  }

  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}
