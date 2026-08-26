import type { DigitalCustomerCard } from "@/features/customer-cards/model";
import type { CustomerNotification } from "@/features/notifications/model";
import { countUnreadNotifications } from "@/features/notifications/model";

export interface CustomerActivityItem {
  id: string;
  businessName: string;
  cardName?: string;
  description: string;
  points: number;
  occurredAt: string;
  tone: "earn" | "redeem" | "neutral";
}

export interface CustomerExploreOffer {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  categorySlug?: string | null;
  categoryName?: string | null;
  href?: string;
  customerCardId: string | null;
  isFavorite: boolean;
  offerNotificationsEnabled: boolean;
  claimId: string | null;
  claimCode: string | null;
  claimStatus: "activated" | "redeemed" | "expired" | "cancelled" | null;
  claimExpiresAt: string | null;
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
  notifications: CustomerNotification[];
  profile: CustomerProfileSummary;
  totalPoints: number;
  totalValueMzn: number;
  activeCardCount: number;
  hasCards: boolean;
  hasActivity: boolean;
  hasOffers: boolean;
  hasNotifications: boolean;
  unreadNotificationCount: number;
}

export function buildCustomerDashboardViewModel({
  cards,
  activity,
  offers,
  notifications,
  profile
}: {
  cards: DigitalCustomerCard[];
  activity: CustomerActivityItem[];
  offers: CustomerExploreOffer[];
  notifications: CustomerNotification[];
  profile: CustomerProfileSummary;
}): CustomerDashboardViewModel {
  const totalPoints = cards.reduce((sum, card) => sum + card.availablePoints, 0);
  const totalValueMzn = cards.reduce((sum, card) => sum + card.valueMzn, 0);
  const activeCardCount = cards.filter((card) => card.status === "active").length;

  return {
    cards,
    activity,
    offers,
    notifications,
    profile,
    totalPoints,
    totalValueMzn,
    activeCardCount,
    hasCards: cards.length > 0,
    hasActivity: activity.length > 0,
    hasOffers: offers.length > 0,
    hasNotifications: notifications.length > 0,
    unreadNotificationCount: countUnreadNotifications(notifications)
  };
}

export function getLedgerActivityDescription(item: {
  type: string;
  reason: string | null;
}): string {
  if (item.type === "redeem") return "YELAS utilizadas no pagamento";
  if (item.type === "earn" && item.reason === "purchase_earn_after_redemption") {
    return "YELAS ganhas sobre o valor pago";
  }
  if (item.type === "earn") return "YELAS ganhas na compra";
  if (item.type === "bonus") return "Bónus de YELAS";
  if (item.type === "referral") return "YELAS por indicação";
  if (item.type === "birthday") return "YELAS de aniversário";
  if (item.type === "expire") return "YELAS expiradas";
  if (item.type === "refund_reversal") return "Ajuste por reembolso";
  if (item.type === "reversal") return "Movimento revertido";
  return "Ajuste de YELAS";
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
