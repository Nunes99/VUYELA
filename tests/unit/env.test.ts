import { describe, expect, it } from "vitest";

import {
  getSiteUrl,
  getSupabaseServiceRoleKey,
  isNotificationEmailConfigured,
  isPhoneAuthEnabled
} from "@/lib/env";

describe("getSiteUrl", () => {
  it("falls back to localhost when no site URL is configured", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(getSiteUrl()).toBe("http://localhost:3000");

    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousUrl;
    }
  });

  it("removes a trailing slash from the configured site URL", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://vuyela.co.mz/";

    expect(getSiteUrl()).toBe("https://vuyela.co.mz");

    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousUrl;
    }
  });
});

describe("isPhoneAuthEnabled", () => {
  it("keeps phone authentication disabled unless explicitly enabled", () => {
    const previousValue = process.env.SUPABASE_PHONE_AUTH_ENABLED;
    delete process.env.SUPABASE_PHONE_AUTH_ENABLED;

    expect(isPhoneAuthEnabled()).toBe(false);

    process.env.SUPABASE_PHONE_AUTH_ENABLED = "true";
    expect(isPhoneAuthEnabled()).toBe(true);

    if (previousValue === undefined) {
      delete process.env.SUPABASE_PHONE_AUTH_ENABLED;
    } else {
      process.env.SUPABASE_PHONE_AUTH_ENABLED = previousValue;
    }
  });
});

describe("isNotificationEmailConfigured", () => {
  it("requires both the provider key and sender identity", () => {
    const previousApiKey = process.env.RESEND_API_KEY;
    const previousFrom = process.env.NOTIFICATION_EMAIL_FROM;
    delete process.env.RESEND_API_KEY;
    delete process.env.NOTIFICATION_EMAIL_FROM;

    expect(isNotificationEmailConfigured()).toBe(false);

    process.env.RESEND_API_KEY = "re_test";
    expect(isNotificationEmailConfigured()).toBe(false);

    process.env.NOTIFICATION_EMAIL_FROM = "VUYELA <notificacoes@example.com>";
    expect(isNotificationEmailConfigured()).toBe(true);

    restoreEnvironmentValue("RESEND_API_KEY", previousApiKey);
    restoreEnvironmentValue("NOTIFICATION_EMAIL_FROM", previousFrom);
  });
});

describe("getSupabaseServiceRoleKey", () => {
  it("prefers the modern Supabase secret key", () => {
    const previousSecretKey = process.env.SUPABASE_SECRET_KEY;
    const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SECRET_KEY = "modern-secret";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-service-role";

    expect(getSupabaseServiceRoleKey()).toBe("modern-secret");

    restoreEnvironmentValue("SUPABASE_SECRET_KEY", previousSecretKey);
    restoreEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY", previousServiceRoleKey);
  });

  it("supports the legacy service role key", () => {
    const previousSecretKey = process.env.SUPABASE_SECRET_KEY;
    const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-service-role";

    expect(getSupabaseServiceRoleKey()).toBe("legacy-service-role");

    restoreEnvironmentValue("SUPABASE_SECRET_KEY", previousSecretKey);
    restoreEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY", previousServiceRoleKey);
  });

  it("rejects an unconfigured privileged client", () => {
    const previousSecretKey = process.env.SUPABASE_SECRET_KEY;
    const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => getSupabaseServiceRoleKey()).toThrow(
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY"
    );

    restoreEnvironmentValue("SUPABASE_SECRET_KEY", previousSecretKey);
    restoreEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY", previousServiceRoleKey);
  });
});

function restoreEnvironmentValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
