import { expect, test } from "@playwright/test";

test.describe("admin overview design", () => {
  test("renders the operational desktop hierarchy", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/dev/admin");

    await expect(
      page.getByRole("heading", { name: "Painel de Controlo - Visão Geral" })
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Administração da plataforma" })
    ).toBeVisible();
    await expect(page.getByText("Volume transacional (6 meses)")).toBeVisible();
    await expect(page.getByText("Mapa de calor - transações por hora")).toBeVisible();
    await expect(page.getByText("Registo de acesso & conversão")).toBeVisible();
    await expect(page.getByText(/45[\s\u00a0]800,00 MZN/).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("MTn");
  });

  test("keeps the mobile overview inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dev/admin");

    await expect(
      page.getByRole("heading", { name: "Painel de Controlo - Visão Geral" })
    ).toBeVisible();
    await expect(page.getByText("Negócios ativos")).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));

    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  });
});
