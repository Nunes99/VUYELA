import { expect, test } from "@playwright/test";

for (const view of [
  "overview",
  "businesses",
  "users",
  "subscriptions",
  "support",
  "fraud",
  "audit"
]) {
  test(`protects the ${view} administration view`, async ({ page }) => {
    await page.goto(`/admin?view=${view}`);

    await expect(
      page.getByRole("heading", { name: "Autenticacao ainda nao esta ligada." })
    ).toBeVisible();
    await expect(page.getByText("Configurar Supabase")).toBeVisible();
  });
}
