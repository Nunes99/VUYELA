import { test } from "@playwright/test";
import { expectUnavailablePortal } from "./support/protected-state";

for (const view of [
  "overview",
  "businesses",
  "categories",
  "users",
  "subscriptions",
  "support",
  "fraud",
  "audit",
  "analytics",
  "settings",
  "business-detail",
  "user-detail"
]) {
  test(`protects the ${view} administration view`, async ({ page }) => {
    await page.goto(`/admin?view=${view}`);

    await expectUnavailablePortal(page, "Configuração necessária");
  });
}
