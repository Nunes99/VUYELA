import "server-only";

import { randomUUID } from "node:crypto";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

import { ResendEmailNotificationProvider } from "./email-provider";
import {
  buildProviderIdempotencyKey,
  getNotificationRetryDelaySeconds,
  isNotificationChannel
} from "./model";
import type { NotificationChannel } from "./model";
import { createUnsupportedNotificationProvider, inAppNotificationProvider } from "./provider";
import type { NotificationDeliveryResult, NotificationProvider } from "./provider";

interface ClaimedNotificationRow {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  idempotency_key: string | null;
  attempt_count: number;
  max_attempts: number;
  recipient_email: string | null;
  business_name: string | null;
  metadata: unknown;
  lock_token: string;
}

export interface NotificationProcessingSummary {
  claimed: number;
  sent: number;
  delivered: number;
  retried: number;
  failed: number;
}

const emailProvider = new ResendEmailNotificationProvider();

export async function processPendingNotifications(
  limit = 25
): Promise<NotificationProcessingSummary> {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
  const supabase = createSupabaseServiceRoleClient();
  const lockToken = randomUUID();
  const { data, error } = await supabase.rpc("claim_notification_deliveries", {
    p_limit: safeLimit,
    p_lock_token: lockToken
  });

  if (error) {
    throw new Error("Não foi possível reservar notificações pendentes.");
  }

  const rows = Array.isArray(data) ? (data as ClaimedNotificationRow[]) : [];
  const summary: NotificationProcessingSummary = {
    claimed: rows.length,
    sent: 0,
    delivered: 0,
    retried: 0,
    failed: 0
  };

  for (const row of rows) {
    const result = await deliverClaimedNotification(row);
    const outcome = await persistDeliveryResult(row, result);
    summary[outcome] += 1;
  }

  return summary;
}

async function deliverClaimedNotification(
  row: ClaimedNotificationRow
): Promise<NotificationDeliveryResult> {
  if (!isNotificationChannel(row.channel)) {
    return { ok: false, message: "Canal de notificação inválido.", retryable: false };
  }

  const provider = getNotificationProvider(row.channel);

  return provider.deliver({
    notificationId: row.id,
    channel: row.channel,
    recipientEmail: row.recipient_email,
    businessName: row.business_name,
    subject: row.subject?.trim() || "Nova notificação VUYELA",
    body: row.body,
    idempotencyKey: buildProviderIdempotencyKey(row.id, row.idempotency_key)
  });
}

function getNotificationProvider(channel: NotificationChannel): NotificationProvider {
  if (channel === "in_app") {
    return inAppNotificationProvider;
  }

  if (channel === "email") {
    return emailProvider;
  }

  return createUnsupportedNotificationProvider(channel);
}

async function persistDeliveryResult(
  row: ClaimedNotificationRow,
  result: NotificationDeliveryResult
): Promise<"sent" | "delivered" | "retried" | "failed"> {
  const supabase = createSupabaseServiceRoleClient();
  const now = new Date();

  if (result.ok) {
    const status = result.delivered ? "delivered" : "sent";
    const { error } = await supabase
      .from("notifications")
      .update({
        status,
        sent_at: now.toISOString(),
        delivered_at: result.delivered ? now.toISOString() : null,
        provider_message_id: result.providerMessageId,
        last_error: null,
        locked_at: null,
        lock_token: null
      })
      .eq("id", row.id)
      .eq("lock_token", row.lock_token);

    if (error) {
      throw new Error("Não foi possível confirmar a entrega da notificação.");
    }

    return status;
  }

  const exhausted = row.attempt_count >= row.max_attempts;
  const failed = exhausted || !result.retryable;
  const retryAt = new Date(
    now.getTime() + getNotificationRetryDelaySeconds(row.attempt_count) * 1000
  );
  const { error } = await supabase
    .from("notifications")
    .update({
      status: failed ? "failed" : "queued",
      failed_at: failed ? now.toISOString() : null,
      next_attempt_at: failed ? now.toISOString() : retryAt.toISOString(),
      last_error: result.message.slice(0, 500),
      locked_at: null,
      lock_token: null
    })
    .eq("id", row.id)
    .eq("lock_token", row.lock_token);

  if (error) {
    throw new Error("Não foi possível registar a tentativa de notificação.");
  }

  return failed ? "failed" : "retried";
}
