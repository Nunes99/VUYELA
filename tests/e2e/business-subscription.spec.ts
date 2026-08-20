import { expect, test } from "@playwright/test";

test("shows the protected business subscription fallback", async ({ page }) => {
  await page.goto("/negocio/subscricao");

  await expect(
    page.getByRole("heading", { name: "Autenticacao ainda nao esta ligada." })
  ).toBeVisible();
  await expect(page.getByText("Configurar Supabase")).toBeVisible();
});
