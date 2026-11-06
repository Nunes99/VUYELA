import { test } from "@playwright/test";
import { expectUnavailablePortal } from "./support/protected-state";

test("shows the protected business campaigns fallback", async ({ page }) => {
  await page.goto("/negocio/campanhas");

  await expectUnavailablePortal(page);
});
