export const offlineCardPayloadVersion = 1;

export interface OfflineCardIdentification {
  id: string;
  businessId: string;
  businessName: string;
  cardNumber: string;
  qrCode: string;
}

export interface OfflineCardPayload {
  version: typeof offlineCardPayloadVersion;
  updatedAt: string;
  cards: OfflineCardIdentification[];
}

export function createOfflineCardPayload(
  cards: OfflineCardIdentification[],
  updatedAt = new Date().toISOString()
): OfflineCardPayload {
  return {
    version: offlineCardPayloadVersion,
    updatedAt,
    cards: cards.map(normalizeOfflineCard).filter(isOfflineCardIdentification)
  };
}

export function parseOfflineCardPayload(value: unknown): OfflineCardPayload | null {
  if (!isRecord(value) || value.version !== offlineCardPayloadVersion) {
    return null;
  }

  if (typeof value.updatedAt !== "string" || !Array.isArray(value.cards)) {
    return null;
  }

  const cards = value.cards.map(normalizeOfflineCard).filter(isOfflineCardIdentification);

  return {
    version: offlineCardPayloadVersion,
    updatedAt: value.updatedAt,
    cards
  };
}

function normalizeOfflineCard(value: unknown): OfflineCardIdentification | null {
  if (!isRecord(value)) {
    return null;
  }

  const card = {
    id: boundedString(value.id, 100),
    businessId: boundedString(value.businessId, 100),
    businessName: boundedString(value.businessName, 160),
    cardNumber: boundedString(value.cardNumber, 100),
    qrCode: boundedString(value.qrCode, 320)
  };

  if (!card.qrCode.startsWith(`VUYELA:CARD:${card.businessId}:`)) {
    return null;
  }

  return card;
}

function isOfflineCardIdentification(
  value: OfflineCardIdentification | null
): value is OfflineCardIdentification {
  return Boolean(
    value?.id && value.businessId && value.businessName && value.cardNumber && value.qrCode
  );
}

function boundedString(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
