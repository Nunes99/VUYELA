import { expect, test } from "@playwright/test";

test("shows public marketplace empty state when Supabase is not configured", async ({ page }) => {
  await page.goto("/estabelecimentos");

  await expect(
    page.getByRole("heading", { name: "Estabelecimentos com benefícios VUYELA" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ainda sem estabelecimentos para publicar" })
  ).toBeVisible();
  const mobileMenuTrigger = page.getByLabel("Abrir navegação pública");
  let publicNavigation = page.getByLabel("Navegação pública");

  if (await mobileMenuTrigger.isVisible()) {
    await mobileMenuTrigger.click();
    publicNavigation = page.getByLabel("Navegação pública mobile");
  }

  await expect(publicNavigation.getByRole("link", { name: "Categorias" })).toBeVisible();
  await expect(publicNavigation.getByRole("link", { name: "Ofertas" })).toBeVisible();
});
