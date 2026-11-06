import { test } from "@playwright/test";
import { expectUnavailablePortal } from "./support/protected-state";

test("shows the protected customer dashboard fallback", async ({ page }) => {
  await page.goto("/cliente");

  await expectUnavailablePortal(page);
});
