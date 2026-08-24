import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

const dashboardViews = [
  "dashboard",
  "filiais",
  "cartoes",
  "clientes",
  "fidelizacao",
  "analitica",
  "pos",
  "transacoes"
];

test("protects every business dashboard view", async ({ page }) => {
  for (const view of dashboardViews) {
    await page.goto(`/negocio?vista=${view}`);

    await expect(
      page.getByRole("heading", { name: "Autenticação ainda não está ligada." })
    ).toBeVisible();
    await expect(page.getByText("Configurar Supabase")).toBeVisible();
  }
});
