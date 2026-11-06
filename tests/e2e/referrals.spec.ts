import { test } from "@playwright/test";
import { expectUnavailablePortal } from "./support/protected-state";

test("shows the protected customer referrals fallback", async ({ page }) => {
  await page.goto("/cliente/indicacoes");

  await expectUnavailablePortal(page);
});

test("shows the protected business referrals fallback", async ({ page }) => {
  await page.goto("/negocio/indicacoes");

  await expectUnavailablePortal(page);
});
