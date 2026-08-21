export const campaignTypes = [
  "welcome",
  "first_purchase",
  "second_purchase",
  "birthday",
  "inactive_customer",
  "double_points",
  "specific_product",
  "specific_time",
  "weekend",
  "referral",
  "expiring_points",
  "vip",
  "location"
] as const;

export type CampaignType = (typeof campaignTypes)[number];

export const campaignStatuses = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled"
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];

export const campaignRewardTypes = [
  "points_multiplier",
  "bonus_points",
  "discount_percent",
  "message_only"
] as const;

export type CampaignRewardType = (typeof campaignRewardTypes)[number];

export const campaignPlannedChannels = ["in_app", "email", "sms", "whatsapp", "push"] as const;

export type CampaignPlannedChannel = (typeof campaignPlannedChannels)[number];

export interface CampaignRuleConfig {
  rewardType: CampaignRewardType;
  plannedChannel: CampaignPlannedChannel;
  notificationSubject: string;
  notificationBody: string;
  pointsMultiplier?: number | undefined;
  bonusPoints?: number | undefined;
  discountPercent?: number | undefined;
}

export interface CampaignAudienceCriteria {
  city?: string | undefined;
  minPurchaseCount?: number | undefined;
  maxPurchaseCount?: number | undefined;
  minTotalSpentMznMinor?: number | undefined;
  lastPurchaseBeforeDays?: number | undefined;
  minPointsBalance?: number | undefined;
  maxPointsBalance?: number | undefined;
  tierName?: string | undefined;
  requiresMarketingConsent: boolean;
}

export interface BusinessCampaign {
  id: string;
  businessId: string;
  name: string;
  status: CampaignStatus;
  campaignType: CampaignType;
  startsAt: string | null;
  endsAt: string | null;
  rules: CampaignRuleConfig;
  audience: CampaignAudienceCriteria;
  audienceCount: number;
  consentedAudienceCount: number;
  notificationCount: number;
  queuedNotificationCount: number;
  deliveredNotificationCount: number;
  failedNotificationCount: number;
  createdAt: string;
}

export interface CampaignEligibilityCustomer {
  id: string;
  customerName: string;
  purchaseCount: number;
  totalSpentMznMinor: number;
  lastPurchaseAt: string | null;
  tierName: string | null;
  pointsBalance: number;
  city: string | null;
  hasMarketingConsent: boolean;
}

export interface CampaignEligibilityResult {
  customerId: string;
  customerName: string;
  eligible: boolean;
  consentRequired: boolean;
  consentBlocked: boolean;
  reason: string;
  segmentKey: string;
}

export interface CampaignAnalytics {
  totalCampaigns: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalAudienceCount: number;
  consentedAudienceCount: number;
  averageAudienceCount: number;
  consentCoverageRate: number;
  notificationCount: number;
  queuedNotificationCount: number;
  deliveredNotificationCount: number;
  failedNotificationCount: number;
}

export function isCampaignType(value: string): value is CampaignType {
  return campaignTypes.includes(value as CampaignType);
}

export function isCampaignStatus(value: string): value is CampaignStatus {
  return campaignStatuses.includes(value as CampaignStatus);
}

export function isCampaignRewardType(value: string): value is CampaignRewardType {
  return campaignRewardTypes.includes(value as CampaignRewardType);
}

export function isCampaignPlannedChannel(value: string): value is CampaignPlannedChannel {
  return campaignPlannedChannels.includes(value as CampaignPlannedChannel);
}

export function isDeliverableCampaignChannel(
  value: CampaignPlannedChannel
): value is "in_app" | "email" {
  return value === "in_app" || value === "email";
}

export function getCampaignTypeLabel(type: CampaignType): string {
  const labels: Record<CampaignType, string> = {
    welcome: "Boas-vindas",
    first_purchase: "Primeira compra",
    second_purchase: "Segunda compra",
    birthday: "Aniversário",
    inactive_customer: "Cliente inativo",
    double_points: "Pontos em dobro",
    specific_product: "Produto especifico",
    specific_time: "Horario especifico",
    weekend: "Fim de semana",
    referral: "Indicação",
    expiring_points: "Pontos a expirar",
    vip: "VIP",
    location: "Localização"
  };

  return labels[type];
}

export function getCampaignStatusLabel(status: CampaignStatus): string {
  const labels: Record<CampaignStatus, string> = {
    draft: "Rascunho",
    scheduled: "Agendada",
    active: "Ativa",
    paused: "Pausada",
    completed: "Concluída",
    cancelled: "Cancelada"
  };

  return labels[status];
}

export function deriveCampaignStatus(input: {
  saveAsDraft: boolean;
  startsAt: string | null;
  now?: Date | undefined;
}): CampaignStatus {
  if (input.saveAsDraft) {
    return "draft";
  }

  if (!input.startsAt) {
    return "active";
  }

  const start = new Date(input.startsAt);
  const now = input.now ?? new Date();

  return Number.isFinite(start.getTime()) && start.getTime() > now.getTime()
    ? "scheduled"
    : "active";
}

export function calculateCampaignEligibility(input: {
  campaignType: CampaignType;
  audience: CampaignAudienceCriteria;
  customers: CampaignEligibilityCustomer[];
  referenceAt?: Date | undefined;
}): CampaignEligibilityResult[] {
  const referenceAt = input.referenceAt ?? new Date();
  const segmentKey = buildSegmentKey(input.campaignType, input.audience);

  return input.customers.map((customer) => {
    const typeReason = getTypeEligibilityReason(input.campaignType, customer, {
      referenceAt,
      inactiveDays: input.audience.lastPurchaseBeforeDays
    });
    const audienceReason =
      typeReason ?? getAudienceEligibilityReason(customer, input.audience, referenceAt);
    const consentBlocked =
      audienceReason === null &&
      input.audience.requiresMarketingConsent &&
      !customer.hasMarketingConsent;
    const eligible = audienceReason === null && !consentBlocked;

    return {
      customerId: customer.id,
      customerName: customer.customerName,
      eligible,
      consentRequired: input.audience.requiresMarketingConsent,
      consentBlocked,
      reason: consentBlocked
        ? "Consentimento de marketing em falta"
        : (audienceReason ?? "Elegivel"),
      segmentKey
    };
  });
}

export function buildCampaignAnalytics(campaigns: BusinessCampaign[]): CampaignAnalytics {
  const totalAudienceCount = sumBy(campaigns, (campaign) => campaign.audienceCount);
  const consentedAudienceCount = sumBy(campaigns, (campaign) => campaign.consentedAudienceCount);

  return {
    totalCampaigns: campaigns.length,
    draftCampaigns: countStatus(campaigns, "draft"),
    scheduledCampaigns: countStatus(campaigns, "scheduled"),
    activeCampaigns: countStatus(campaigns, "active"),
    completedCampaigns: countStatus(campaigns, "completed"),
    totalAudienceCount,
    consentedAudienceCount,
    averageAudienceCount:
      campaigns.length > 0 ? Math.round(totalAudienceCount / campaigns.length) : 0,
    consentCoverageRate: totalAudienceCount > 0 ? consentedAudienceCount / totalAudienceCount : 0,
    notificationCount: sumBy(campaigns, (campaign) => campaign.notificationCount),
    queuedNotificationCount: sumBy(campaigns, (campaign) => campaign.queuedNotificationCount),
    deliveredNotificationCount: sumBy(campaigns, (campaign) => campaign.deliveredNotificationCount),
    failedNotificationCount: sumBy(campaigns, (campaign) => campaign.failedNotificationCount)
  };
}

export function buildSegmentKey(
  campaignType: CampaignType,
  audience: CampaignAudienceCriteria
): string {
  const parts: string[] = [campaignType];

  if (audience.city) {
    parts.push(`city:${normalizeText(audience.city)}`);
  }

  if (audience.tierName) {
    parts.push(`tier:${normalizeText(audience.tierName)}`);
  }

  if (audience.minPurchaseCount !== undefined) {
    parts.push(`min-purchases:${audience.minPurchaseCount}`);
  }

  if (audience.maxPurchaseCount !== undefined) {
    parts.push(`max-purchases:${audience.maxPurchaseCount}`);
  }

  if (audience.lastPurchaseBeforeDays !== undefined) {
    parts.push(`inactive:${audience.lastPurchaseBeforeDays}`);
  }

  if (audience.requiresMarketingConsent) {
    parts.push("consented");
  }

  return parts.join("|");
}

function getTypeEligibilityReason(
  campaignType: CampaignType,
  customer: CampaignEligibilityCustomer,
  input: { referenceAt: Date; inactiveDays?: number | undefined }
): string | null {
  if (campaignType === "welcome" || campaignType === "first_purchase") {
    return customer.purchaseCount === 0 ? null : "Cliente já comprou";
  }

  if (campaignType === "second_purchase") {
    return customer.purchaseCount === 1 ? null : "O cliente não está na segunda compra";
  }

  if (campaignType === "inactive_customer") {
    const inactiveDays = input.inactiveDays ?? 30;

    if (!customer.lastPurchaseAt || customer.purchaseCount === 0) {
      return "Cliente ainda sem compra anterior";
    }

    const lastPurchase = new Date(customer.lastPurchaseAt);
    const inactiveSince = input.referenceAt.getTime() - inactiveDays * 24 * 60 * 60 * 1000;

    return Number.isFinite(lastPurchase.getTime()) && lastPurchase.getTime() <= inactiveSince
      ? null
      : "Cliente ainda ativo";
  }

  return null;
}

function getAudienceEligibilityReason(
  customer: CampaignEligibilityCustomer,
  audience: CampaignAudienceCriteria,
  referenceAt: Date
): string | null {
  if (audience.city && normalizeText(customer.city ?? "") !== normalizeText(audience.city)) {
    return "Cidade fora do segmento";
  }

  if (
    audience.tierName &&
    normalizeText(customer.tierName ?? "") !== normalizeText(audience.tierName)
  ) {
    return "Tier fora do segmento";
  }

  if (
    audience.minPurchaseCount !== undefined &&
    customer.purchaseCount < audience.minPurchaseCount
  ) {
    return "Compras abaixo do mínimo";
  }

  if (
    audience.maxPurchaseCount !== undefined &&
    customer.purchaseCount > audience.maxPurchaseCount
  ) {
    return "Compras acima do máximo";
  }

  if (
    audience.minTotalSpentMznMinor !== undefined &&
    customer.totalSpentMznMinor < audience.minTotalSpentMznMinor
  ) {
    return "Valor gasto abaixo do mínimo";
  }

  if (
    audience.minPointsBalance !== undefined &&
    customer.pointsBalance < audience.minPointsBalance
  ) {
    return "Saldo de pontos abaixo do mínimo";
  }

  if (
    audience.maxPointsBalance !== undefined &&
    customer.pointsBalance > audience.maxPointsBalance
  ) {
    return "Saldo de pontos acima do máximo";
  }

  if (audience.lastPurchaseBeforeDays !== undefined) {
    if (!customer.lastPurchaseAt) {
      return "Cliente sem última compra";
    }

    const lastPurchase = new Date(customer.lastPurchaseAt);
    const inactiveSince =
      referenceAt.getTime() - audience.lastPurchaseBeforeDays * 24 * 60 * 60 * 1000;

    if (!Number.isFinite(lastPurchase.getTime()) || lastPurchase.getTime() > inactiveSince) {
      return "Última compra ainda recente";
    }
  }

  return null;
}

function countStatus(campaigns: BusinessCampaign[], status: CampaignStatus): number {
  return campaigns.filter((campaign) => campaign.status === status).length;
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
