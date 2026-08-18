import { expect, test } from "@playwright/test";

test("keeps the notification worker closed to anonymous requests", async ({ request }) => {
  const response = await request.get("/api/cron/notifications");

  expect([401, 503]).toContain(response.status());
  await expect(response.json()).resolves.toHaveProperty("error");
});
