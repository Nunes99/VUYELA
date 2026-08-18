export const notificationChannels = ["in_app", "email", "sms", "whatsapp", "push"] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

export interface CustomerNotification {
  id: string;
  businessName: string;
  subject: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

const retryDelaysSeconds = [60, 5 * 60, 30 * 60, 2 * 60 * 60, 6 * 60 * 60] as const;

export function isNotificationChannel(value: string): value is NotificationChannel {
  return notificationChannels.includes(value as NotificationChannel);
}

export function getNotificationRetryDelaySeconds(attemptCount: number): number {
  const index = Math.max(0, Math.min(Math.trunc(attemptCount) - 1, retryDelaysSeconds.length - 1));

  return retryDelaysSeconds[index];
}

export function buildProviderIdempotencyKey(notificationId: string, storedKey: string | null) {
  const key = storedKey?.trim() || `notification:${notificationId}`;

  return key.slice(0, 256);
}

export function countUnreadNotifications(notifications: CustomerNotification[]): number {
  return notifications.filter((notification) => notification.readAt === null).length;
}
