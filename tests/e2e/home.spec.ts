import { expect, test } from "@playwright/test";

test("shows the public homepage", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Cada compra cria uma razao para voltar." })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Quero um cartao" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Voltar fica simples quando o beneficio e claro." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Pontos VUYELA sao promocionais, claros e locais ao negocio."
    })
  ).toBeVisible();
});
