import { expect, test } from "@playwright/test";

test("shows the protected business campaigns fallback", async ({ page }) => {
  await page.goto("/negocio/campanhas");

  await expect(
    page.getByRole("heading", { name: "Autenticação ainda não está ligada." })
  ).toBeVisible();
  await expect(page.getByText("Configurar Supabase")).toBeVisible();
});
