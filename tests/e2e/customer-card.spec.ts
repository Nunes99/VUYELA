import { expect, test } from "@playwright/test";

test("shows the protected customer dashboard fallback", async ({ page }) => {
  await page.goto("/cliente");

  await expect(
    page.getByRole("heading", { name: "Autenticacao ainda nao esta ligada." })
  ).toBeVisible();
  await expect(page.getByText("Configurar Supabase")).toBeVisible();
});
