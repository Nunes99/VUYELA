import { expect, test } from "@playwright/test";

test("shows the protected customer referrals fallback", async ({ page }) => {
  await page.goto("/cliente/indicacoes");

  await expect(
    page.getByRole("heading", { name: "Não foi possível iniciar o acesso." })
  ).toBeVisible();
  await expect(page.getByText("Serviço indisponível")).toBeVisible();
});

test("shows the protected business referrals fallback", async ({ page }) => {
  await page.goto("/negocio/indicacoes");

  await expect(
    page.getByRole("heading", { name: "Não foi possível iniciar o acesso." })
  ).toBeVisible();
  await expect(page.getByText("Serviço indisponível")).toBeVisible();
});
