import { expect, test } from "@playwright/test";

test("shows the foundation page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Cada compra cria uma razao para voltar." })
  ).toBeVisible();
  await expect(page.locator(".foundation-kicker")).toHaveText("VUYELA by LEMOTE");
});
