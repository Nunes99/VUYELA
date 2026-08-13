import { expect, test } from "@playwright/test";

test("shows public search with shareable filters when Supabase is not configured", async ({
  page
}) => {
  await page.goto("/pesquisar?q=mares&ofertas=1");

  await expect(page.getByRole("heading", { name: 'Resultados para "mares"' })).toBeVisible();
  await expect(page.getByLabel("Texto")).toHaveValue("mares");
  await expect(page.getByLabel("Com ofertas activas")).toBeChecked();
  await expect(page.getByRole("button", { name: "Filtrar resultados" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sem resultados para estes filtros" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Pesquisar" }).first()).toBeVisible();
});
