import { expect, test } from "@playwright/test";

test("requires an authenticated session before administrative MFA", async ({ page }) => {
  await page.goto("/mfa?next=/admin");

  await expect(page).toHaveURL(/\/entrar\?next=%2Fadmin$/);
  await expect(page.getByRole("heading", { name: "E-mail e palavra-passe" })).toBeVisible();
});
