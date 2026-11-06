import { test } from "@playwright/test";
import { expectUnavailablePortal } from "./support/protected-state";

test("shows the protected business subscription fallback", async ({ page }) => {
  await page.goto("/negocio/subscricao");

  await expectUnavailablePortal(page);
});
