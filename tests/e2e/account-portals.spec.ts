import { expect, test } from "@playwright/test";

test("keeps customer and business registration as distinct responsive flows", async ({ page }) => {
  await page.goto("/cadastrar/negocio");

  await expect(
    page.getByRole("heading", { name: "Um acesso criado exclusivamente para o seu negócio." })
  ).toBeVisible();
  await expect(page.getByLabel("Nome do responsável")).toBeVisible();
  await expect(page.getByLabel("E-mail de acesso")).toBeVisible();
  await expect(page.locator('input[name="portal"]')).toHaveCount(0);

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);

  await page.goto("/entrar/negocio");
  await expect(page.locator('input[name="portal"]')).toHaveValue("business");
  await expect(page.getByText("Entrar como cliente")).toBeVisible();

  await page.goto(`/cadastrar/negocio/equipa?token=${"a".repeat(48)}`);
  await expect(
    page.getByRole("heading", { name: "Credenciais próprias para trabalhar no negócio." })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar credenciais de equipa" })).toBeVisible();
});

test("uses a compact business menu on mobile without exposing the customer portal", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile navigation contract");

  await page.goto("/dev/business");
  await expect(page.getByText("Portal de Negócio")).toBeVisible();
  await page.locator('summary[aria-label="Abrir navegação do negócio"]').click();

  const mobileNavigation = page.getByRole("navigation", { name: "Navegação móvel do negócio" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Filiais" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "POS" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Cliente", exact: true })).toHaveCount(0);

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});
