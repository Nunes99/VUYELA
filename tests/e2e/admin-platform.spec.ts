import { expect, test } from "@playwright/test";

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

    await expect(
      page.getByRole("heading", { name: "Não foi possível iniciar o acesso." })
    ).toBeVisible();
    await expect(page.getByText("Configuração necessária")).toBeVisible();
  });
}
