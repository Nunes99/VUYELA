import { expect, test } from "@playwright/test";

test("shows public marketplace empty state when Supabase is not configured", async ({ page }) => {
  await page.goto("/estabelecimentos");

  await expect(
    page.getByRole("heading", { name: "Estabelecimentos com beneficios VUYELA" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ainda sem estabelecimentos para publicar" })
  ).toBeVisible();
  const publicNavigation = page.getByLabel("Navegacao publica");

  await expect(publicNavigation.getByRole("link", { name: "Categorias" })).toBeVisible();
  await expect(publicNavigation.getByRole("link", { name: "Ofertas" })).toBeVisible();
});
