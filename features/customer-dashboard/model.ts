import type { DigitalCustomerCard } from "@/features/customer-cards/model";

export interface CustomerActivityItem {
  id: string;
  businessName: string;
  description: string;
  points: number;
  occurredAt: string;
  tone: "earn" | "redeem" | "neutral";
}

export interface CustomerExploreOffer {
  id: string;
  businessName: string;
  title: string;
  description: string;
}

export interface CustomerProfileSummary {
  displayName: string;
  email: string | null;
  phone: string | null;
  locale: string;
  marketingConsent: boolean;
}

export interface CustomerDashboardViewModel {
  cards: DigitalCustomerCard[];
  activity: CustomerActivityItem[];
  offers: CustomerExploreOffer[];
  profile: CustomerProfileSummary;
  totalPoints: number;
  totalValueMzn: number;
  activeCardCount: number;
  hasCards: boolean;
  hasActivity: boolean;
  hasOffers: boolean;
}

export function buildCustomerDashboardViewModel({
  cards,
  activity,
  offers,
  profile
}: {
  cards: DigitalCustomerCard[];
  activity: CustomerActivityItem[];
  offers: CustomerExploreOffer[];
  profile: CustomerProfileSummary;
}): CustomerDashboardViewModel {
  const totalPoints = cards.reduce((sum, card) => sum + card.availablePoints, 0);
  const totalValueMzn = cards.reduce((sum, card) => sum + card.valueMzn, 0);
  const activeCardCount = cards.filter((card) => card.status === "active").length;

  return {
    cards,
    activity,
    offers,
    profile,
    totalPoints,
    totalValueMzn,
    activeCardCount,
    hasCards: cards.length > 0,
    hasActivity: activity.length > 0,
    hasOffers: offers.length > 0
  };
}

export function getActivityDescription(item: {
  pointsEarned: number;
  pointsRedeemed: number;
  netAmountMznMinor: number;
}): string {
  if (item.pointsRedeemed > 0 && item.pointsEarned > 0) {
    return `Resgatou ${item.pointsRedeemed.toLocaleString(
      "pt-MZ"
    )} pontos e ganhou ${item.pointsEarned.toLocaleString("pt-MZ")} pontos`;
  }

  if (item.pointsRedeemed > 0) {
    return `Resgatou ${item.pointsRedeemed.toLocaleString("pt-MZ")} pontos`;
  }

  if (item.pointsEarned > 0) {
    return `Ganhou ${item.pointsEarned.toLocaleString("pt-MZ")} pontos`;
  }

  return `Compra de ${Math.floor(item.netAmountMznMinor / 100).toLocaleString("pt-MZ")} MZN`;
}

export function getActivityPoints(item: { pointsEarned: number; pointsRedeemed: number }): number {
  return item.pointsEarned - item.pointsRedeemed;
}

export function getActivityTone(points: number): CustomerActivityItem["tone"] {
  if (points > 0) {
    return "earn";
  }

  if (points < 0) {
    return "redeem";
  }

  return "neutral";
}
