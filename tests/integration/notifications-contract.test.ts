import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/create_notification_delivery.sql"),
  "utf8"
);
const worker = readFileSync(join(process.cwd(), "features/notifications/worker.ts"), "utf8");
const emailProvider = readFileSync(
  join(process.cwd(), "features/notifications/email-provider.ts"),
  "utf8"
);
const cronRoute = readFileSync(join(process.cwd(), "app/api/cron/notifications/route.ts"), "utf8");
const readSecurityMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/secure_notification_read_updates.sql"),
  "utf8"
);
const privilegeMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/restrict_notification_read_column.sql"),
  "utf8"
);

describe("notification delivery contract", () => {
  it("creates one idempotent notification per campaign recipient and channel", () => {
    expect(migration).toContain("notifications_idempotency_key_unique_idx");
    expect(migration).toContain("campaign_audiences_queue_notification");
    expect(migration).toContain("on conflict (idempotency_key)");
    expect(migration).toContain("marketing_consent_missing");
  });

  it("claims due work with a lease and skip-locked concurrency", () => {
    expect(migration).toContain("create or replace function public.claim_notification_deliveries");
    expect(migration).toContain("for update skip locked");
    expect(migration).toContain("locked_at < now() - interval '5 minutes'");
    expect(migration).toContain(
      "grant execute on function public.claim_notification_deliveries(integer, uuid) to service_role"
    );
    expect(migration).toContain(
      "revoke all on function public.claim_notification_deliveries(integer, uuid) from public, anon, authenticated"
    );
  });

  it("retries safely and passes the stored idempotency key to Resend", () => {
    expect(worker).toContain("getNotificationRetryDelaySeconds");
    expect(worker).toContain("buildProviderIdempotencyKey");
    expect(emailProvider).toContain('"Idempotency-Key": request.idempotencyKey');
    expect(emailProvider).toContain("response.status === 429");
  });

  it("protects the cron endpoint and keeps privileged processing server-side", () => {
    expect(cronRoute).toContain("process.env.CRON_SECRET");
    expect(cronRoute).toContain("Bearer ${cronSecret}");
    expect(worker).toContain("createSupabaseServiceRoleClient");
    expect(worker).toContain('import "server-only"');
  });

  it("allows recipients to mark only delivered in-app notifications as read", () => {
    expect(migration).toContain("create or replace function public.mark_notification_read");
    expect(migration).toContain("n.profile_id = auth.uid()");
    expect(migration).toContain("public.owns_customer_card(n.customer_card_id)");
    expect(migration).toContain("n.channel = 'in_app'");
    expect(readSecurityMigration).toContain(
      "alter function public.mark_notification_read(uuid) security invoker"
    );
    expect(readSecurityMigration).toContain("grant update (read_at)");
    expect(readSecurityMigration).toContain("notifications_recipient_update_read_at");
    expect(readSecurityMigration).toContain("profile_id = (select auth.uid())");
    expect(privilegeMigration).toContain(
      "revoke all privileges on table public.notifications from anon, authenticated"
    );
    expect(privilegeMigration).toContain("grant select on table public.notifications");
    expect(privilegeMigration).toContain("grant update (read_at)");
  });
});
