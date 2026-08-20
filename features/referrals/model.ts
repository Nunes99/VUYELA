export const referralStatuses = [
  "pending",
  "accepted",
  "rewarded",
  "reversed",
  "expired",
  "blocked",
  "cancelled"
] as const;

export type ReferralStatus = (typeof referralStatuses)[number];
export type ReferralRole = "referrer" | "referred";

export interface ReferralProgramRules {
  isActive: boolean;
  qualifyingPurchaseMinimumMznMinor: number;
  referrerRewardPoints: number;
  referredRewardPoints: number;
  inviteValidDays: number;
  maxOpenInvitesPerReferrer: number;
  rewardLimitCount: number;
  rewardLimitPeriodDays: number;
}

export interface CustomerReferralProgram extends ReferralProgramRules {
  id: string;
  businessId: string;
  businessName: string;
  cardId: string;
  cardNumber: string;
  pointValueMznMinor: number;
}

export interface ReferralHistoryItem {
  id: string;
  businessId: string;
  businessName: string;
  referrerCardId: string;
  referredCardId: string | null;
  referralCode: string;
  status: ReferralStatus;
  role: ReferralRole;
  referrerRewardPoints: number;
  referredRewardPoints: number;
  pointValueMznMinor: number;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  rewardedAt: string | null;
  blockedReason: string | null;
}

export interface ReferralSummary {
  pendingCount: number;
  acceptedCount: number;
  rewardedCount: number;
  totalRewardPoints: number;
  totalRewardValueMznMinor: number;
}

export interface BusinessReferralSummary {
  pendingCount: number;
  acceptedCount: number;
  rewardedCount: number;
  blockedCount: number;
  totalIssuedPoints: number;
  totalIssuedValueMznMinor: number;
  fraudEventCount: number;
}

export const defaultReferralProgramRules: ReferralProgramRules = {
  isActive: false,
  qualifyingPurchaseMinimumMznMinor: 50000,
  referrerRewardPoints: 500,
  referredRewardPoints: 250,
  inviteValidDays: 14,
  maxOpenInvitesPerReferrer: 5,
  rewardLimitCount: 10,
  rewardLimitPeriodDays: 30
};

export function isReferralStatus(value: string): value is ReferralStatus {
  return referralStatuses.includes(value as ReferralStatus);
}

export function getEffectiveReferralStatus(
  status: ReferralStatus,
  expiresAt: string,
  now = new Date()
): ReferralStatus {
  if (status === "pending" && new Date(expiresAt) <= now) {
    return "expired";
  }

  return status;
}

export function getReferralStatusLabel(status: ReferralStatus): string {
  const labels: Record<ReferralStatus, string> = {
    pending: "Por aceitar",
    accepted: "Aceite",
    rewarded: "Premiada",
    reversed: "Revertida",
    expired: "Expirada",
    blocked: "Bloqueada",
    cancelled: "Cancelada"
  };

  return labels[status];
}

export function getReferralRoleLabel(role: ReferralRole): string {
  return role === "referrer" ? "Indicador" : "Convidado";
}

export function calculatePointsValueMznMinor(points: number, pointValueMznMinor: number): number {
  if (!Number.isSafeInteger(points) || !Number.isSafeInteger(pointValueMznMinor)) {
    return 0;
  }

  return Math.max(points, 0) * Math.max(pointValueMznMinor, 0);
}

export function formatMznMinor(value: number): string {
  const safeValue = Number.isSafeInteger(value) ? Math.max(value, 0) : 0;

  return `${(safeValue / 100).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MZN`;
}

export function buildReferralSummary(items: ReferralHistoryItem[]): ReferralSummary {
  return items.reduce<ReferralSummary>(
    (summary, item) => {
      if (item.status === "pending") {
        summary.pendingCount += 1;
      }

      if (item.status === "accepted") {
        summary.acceptedCount += 1;
      }

      if (item.status === "rewarded") {
        const rewardPoints =
          item.role === "referrer" ? item.referrerRewardPoints : item.referredRewardPoints;
        summary.rewardedCount += 1;
        summary.totalRewardPoints += rewardPoints;
        summary.totalRewardValueMznMinor += calculatePointsValueMznMinor(
          rewardPoints,
          item.pointValueMznMinor
        );
      }

      return summary;
    },
    {
      pendingCount: 0,
      acceptedCount: 0,
      rewardedCount: 0,
      totalRewardPoints: 0,
      totalRewardValueMznMinor: 0
    }
  );
}

export function buildBusinessReferralSummary(
  items: ReferralHistoryItem[],
  fraudEventCount: number
): BusinessReferralSummary {
  return items.reduce<BusinessReferralSummary>(
    (summary, item) => {
      if (item.status === "pending") {
        summary.pendingCount += 1;
      }

      if (item.status === "accepted") {
        summary.acceptedCount += 1;
      }

      if (item.status === "rewarded") {
        const issuedPoints = item.referrerRewardPoints + item.referredRewardPoints;
        summary.rewardedCount += 1;
        summary.totalIssuedPoints += issuedPoints;
        summary.totalIssuedValueMznMinor += calculatePointsValueMznMinor(
          issuedPoints,
          item.pointValueMznMinor
        );
      }

      if (item.status === "blocked") {
        summary.blockedCount += 1;
      }

      return summary;
    },
    {
      pendingCount: 0,
      acceptedCount: 0,
      rewardedCount: 0,
      blockedCount: 0,
      totalIssuedPoints: 0,
      totalIssuedValueMznMinor: 0,
      fraudEventCount: Math.max(fraudEventCount, 0)
    }
  );
}
