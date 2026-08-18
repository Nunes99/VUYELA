import "server-only";

import type { NotificationChannel } from "./model";

export interface NotificationDeliveryRequest {
  notificationId: string;
  channel: NotificationChannel;
  recipientEmail: string | null;
  businessName: string | null;
  subject: string;
  body: string;
  idempotencyKey: string;
}

export type NotificationDeliveryResult =
  | { ok: true; providerMessageId: string | null; delivered: boolean }
  | { ok: false; message: string; retryable: boolean };

export interface NotificationProvider {
  channel: NotificationChannel;
  deliver(request: NotificationDeliveryRequest): Promise<NotificationDeliveryResult>;
}

class InAppNotificationProvider implements NotificationProvider {
  channel = "in_app" as const;

  async deliver(): Promise<NotificationDeliveryResult> {
    return { ok: true, providerMessageId: null, delivered: true };
  }
}

class UnsupportedNotificationProvider implements NotificationProvider {
  constructor(public readonly channel: NotificationChannel) {}

  async deliver(): Promise<NotificationDeliveryResult> {
    return {
      ok: false,
      message: `O canal ${this.channel} ainda nao esta configurado.`,
      retryable: false
    };
  }
}

export const inAppNotificationProvider = new InAppNotificationProvider();

export function createUnsupportedNotificationProvider(channel: NotificationChannel) {
  return new UnsupportedNotificationProvider(channel);
}
