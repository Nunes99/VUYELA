import { expect, test } from "@playwright/test";

test("shows public marketplace empty state when Supabase is not configured", async ({ page }) => {
  await page.goto("/estabelecimentos");

  await expect(
    page.getByRole("heading", { name: "Estabelecimentos com benefícios VUYELA" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ainda sem estabelecimentos publicados" })
  ).toBeVisible();
  const mobileMenuTrigger = page.getByLabel("Abrir navegação");
  let publicNavigation = page.getByLabel("Descobrir negócios e ofertas");

  if (await mobileMenuTrigger.isVisible()) {
    await mobileMenuTrigger.click();
    publicNavigation = page.getByLabel("Descobrir na VUYELA");
  }

  await expect(publicNavigation.getByRole("link", { name: "Categorias" })).toBeVisible();
  await expect(publicNavigation.getByRole("link", { name: "Ofertas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "VUYELA by LEMOTE" }).first()).toHaveAttribute(
    "href",
    "/"
  );
});
