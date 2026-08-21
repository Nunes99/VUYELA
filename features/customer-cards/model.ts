export type CardStatus = "active" | "blocked" | "archived";

export interface CustomerCardTier {
  id: string;
  name: string;
  minimumLifetimePoints: number;
  sortOrder: number;
}

export interface CustomerCardSource {
  id: string;
  businessId: string;
  businessName: string;
  businessLogoUrl: string | null;
  customerName: string;
  cardNumber: string;
  status: CardStatus;
  joinedAt: string;
  availablePoints: number;
  lifetimeEarned: number;
  pointValueMznMinor: number;
  pointsExpireAfterDays: number | null;
  tiers: CustomerCardTier[];
}

export interface DigitalCustomerCard {
  id: string;
  businessId: string;
  businessName: string;
  businessLogoUrl: string | null;
  customerName: string;
  cardNumber: string;
  status: CardStatus;
  statusLabel: string;
  joinedAt: string;
  availablePoints: number;
  valueMzn: number;
  currentTierName: string;
  nextTierName: string | null;
  pointsUntilNextTier: number | null;
  expiryLabel: string;
  qrCode: string;
}

export function buildDigitalCustomerCard(source: CustomerCardSource): DigitalCustomerCard {
  assertNonNegativeInteger("availablePoints", source.availablePoints);
  assertNonNegativeInteger("lifetimeEarned", source.lifetimeEarned);
  assertPositiveInteger("pointValueMznMinor", source.pointValueMznMinor);

  const tiers = [...source.tiers].sort((first, second) => {
    if (first.minimumLifetimePoints !== second.minimumLifetimePoints) {
      return first.minimumLifetimePoints - second.minimumLifetimePoints;
    }

    return first.sortOrder - second.sortOrder;
  });
  const currentTier = tiers.reduce<CustomerCardTier | null>((selectedTier, tier) => {
    if (tier.minimumLifetimePoints > source.lifetimeEarned) {
      return selectedTier;
    }

    if (!selectedTier || tier.minimumLifetimePoints >= selectedTier.minimumLifetimePoints) {
      return tier;
    }

    return selectedTier;
  }, null);
  const nextTier = tiers.find((tier) => tier.minimumLifetimePoints > source.lifetimeEarned) ?? null;

  return {
    id: source.id,
    businessId: source.businessId,
    businessName: source.businessName,
    businessLogoUrl: source.businessLogoUrl,
    customerName: source.customerName,
    cardNumber: source.cardNumber,
    status: source.status,
    statusLabel: getStatusLabel(source.status),
    joinedAt: source.joinedAt,
    availablePoints: source.availablePoints,
    valueMzn: calculatePointsValueMzn(source.availablePoints, source.pointValueMznMinor),
    currentTierName: currentTier?.name ?? "Base",
    nextTierName: nextTier?.name ?? null,
    pointsUntilNextTier: nextTier
      ? Math.max(nextTier.minimumLifetimePoints - source.lifetimeEarned, 0)
      : null,
    expiryLabel: getExpiryLabel(source.pointsExpireAfterDays),
    qrCode: buildIdentificationQrCode(source.businessId, source.cardNumber)
  };
}

export function calculatePointsValueMzn(points: number, pointValueMznMinor: number): number {
  assertNonNegativeInteger("points", points);
  assertPositiveInteger("pointValueMznMinor", pointValueMznMinor);

  return Math.floor((points * pointValueMznMinor) / 100);
}

export function buildIdentificationQrCode(businessId: string, cardNumber: string): string {
  const normalizedBusinessId = businessId.trim();
  const normalizedCardNumber = cardNumber.trim();

  if (!normalizedBusinessId || !normalizedCardNumber) {
    throw new Error("businessId and cardNumber are required for card QR code");
  }

  return `VUYELA:CARD:${normalizedBusinessId}:${normalizedCardNumber}`;
}

function getStatusLabel(status: CardStatus): string {
  if (status === "blocked") {
    return "Bloqueado";
  }

  if (status === "archived") {
    return "Arquivado";
  }

  return "Cartão digital";
}

function getExpiryLabel(pointsExpireAfterDays: number | null): string {
  if (pointsExpireAfterDays === null) {
    return "Pontos sem expiração configurada";
  }

  if (pointsExpireAfterDays === 1) {
    return "Pontos expiram 1 dia apos serem ganhos";
  }

  return `Pontos expiram ${pointsExpireAfterDays} dias apos serem ganhos`;
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
