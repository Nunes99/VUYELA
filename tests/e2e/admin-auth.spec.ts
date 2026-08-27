import { expect, test } from "@playwright/test";

test("requires an authenticated session before administrative MFA", async ({ page }) => {
  await page.goto("/mfa?next=/admin");

  await expect(page).toHaveURL(/\/admin\/entrar\?next=%2Fadmin$/);
  await expect(
    page.getByRole("heading", { name: "Acesso reservado à gestão da plataforma." })
  ).toBeVisible();
});
