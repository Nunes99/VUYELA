import { describe, expect, it } from "vitest";

import {
  buildProviderIdempotencyKey,
  countUnreadNotifications,
  getNotificationRetryDelaySeconds,
  isNotificationChannel
} from "@/features/notifications/model";

describe("notification model", () => {
  it("uses bounded exponential-style retry delays", () => {
    expect(getNotificationRetryDelaySeconds(1)).toBe(60);
    expect(getNotificationRetryDelaySeconds(2)).toBe(300);
    expect(getNotificationRetryDelaySeconds(5)).toBe(21_600);
    expect(getNotificationRetryDelaySeconds(99)).toBe(21_600);
  });

  it("keeps provider idempotency keys stable and bounded", () => {
    expect(buildProviderIdempotencyKey("notification-1", "campaign:1:email")).toBe(
      "campaign:1:email"
    );
    expect(buildProviderIdempotencyKey("notification-1", null)).toBe("notification:notification-1");
    expect(buildProviderIdempotencyKey("notification-1", "x".repeat(300))).toHaveLength(256);
  });

  it("supports current and future pluggable channels", () => {
    expect(isNotificationChannel("in_app")).toBe(true);
    expect(isNotificationChannel("email")).toBe(true);
    expect(isNotificationChannel("sms")).toBe(true);
    expect(isNotificationChannel("whatsapp")).toBe(true);
    expect(isNotificationChannel("push")).toBe(true);
    expect(isNotificationChannel("fax")).toBe(false);
  });

  it("counts only unread customer notifications", () => {
    expect(
      countUnreadNotifications([
        {
          id: "1",
          businessName: "Loja",
          subject: "Nova campanha",
          body: "Mensagem",
          createdAt: "2026-08-18T10:00:00.000Z",
          readAt: null
        },
        {
          id: "2",
          businessName: "Loja",
          subject: "Lida",
          body: "Mensagem",
          createdAt: "2026-08-18T09:00:00.000Z",
          readAt: "2026-08-18T09:30:00.000Z"
        }
      ])
    ).toBe(1);
  });
});
