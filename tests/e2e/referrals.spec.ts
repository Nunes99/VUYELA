import { expect, test } from "@playwright/test";

test("shows the protected customer referrals fallback", async ({ page }) => {
  await page.goto("/cliente/indicacoes");

  await expect(
    page.getByRole("heading", { name: "Autenticação ainda não está ligada." })
  ).toBeVisible();
  await expect(page.getByText("Configurar Supabase")).toBeVisible();
});

test("shows the protected business referrals fallback", async ({ page }) => {
  await page.goto("/negocio/indicacoes");

  await expect(
    page.getByRole("heading", { name: "Autenticação ainda não está ligada." })
  ).toBeVisible();
  await expect(page.getByText("Configurar Supabase")).toBeVisible();
});
