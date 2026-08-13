import { expect, test } from "@playwright/test";

test("shows the protected POS fallback", async ({ page }) => {
  await page.goto("/pos");

  await expect(
    page.getByRole("heading", { name: "Autenticacao ainda nao esta ligada." })
  ).toBeVisible();
  await expect(page.getByText("Configurar Supabase")).toBeVisible();
});
