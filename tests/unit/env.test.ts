import { describe, expect, it } from "vitest";

import { getSiteUrl, isPhoneAuthEnabled } from "@/lib/env";

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
