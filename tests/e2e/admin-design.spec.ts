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

    await expect(page.getByRole("heading", { exact: true, name: "Visão Geral" })).toBeVisible();
    await expect(page.getByText("Negócios ativos")).toBeVisible();
    await expect(page.locator(".admin-console__mobile-logo")).toBeVisible();
    await expect(page.locator(".admin-bar-chart").first()).toBeVisible();
    await expect(page.locator(".admin-line-chart svg").first()).toBeHidden();
    await expect(page.locator(".admin-overview__advanced").first()).toBeHidden();
    await expect(page.locator(".admin-priority-grid__categories")).toBeHidden();

    const navigationLayout = await page.locator(".admin-sidebar").evaluate((element) => ({
      clientWidth: element.clientWidth,
      overflowX: getComputedStyle(element).overflowX,
      scrollWidth: element.scrollWidth
    }));
    expect(navigationLayout.overflowX).toBe("auto");
    expect(navigationLayout.scrollWidth).toBeGreaterThan(navigationLayout.clientWidth);

    const bottomNavigation = await page.locator(".admin-sidebar").boundingBox();
    expect(bottomNavigation).not.toBeNull();
    expect((bottomNavigation?.y ?? 0) + (bottomNavigation?.height ?? 0)).toBeGreaterThanOrEqual(
      843
    );

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));

    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  });

  test("uses the compact tablet rail and balanced chart cards", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1209 });
    await page.goto("/dev/admin");

    const sidebar = await page.locator(".admin-sidebar").boundingBox();
    expect(sidebar).not.toBeNull();
    expect(sidebar?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(80);
    await expect(page.locator(".admin-sidebar__logo .vuyela-logo__wordmark")).toBeHidden();

    const metrics = page.locator(".admin-overview-metric");
    const firstMetric = await metrics.nth(0).boundingBox();
    const secondMetric = await metrics.nth(1).boundingBox();
    expect(firstMetric).not.toBeNull();
    expect(secondMetric).not.toBeNull();
    expect(Math.abs((firstMetric?.y ?? 0) - (secondMetric?.y ?? 0))).toBeLessThanOrEqual(1);

    await expect(page.locator(".admin-bar-chart").first()).toBeVisible();
    await expect(page.locator(".admin-donut")).toBeHidden();
    await expect(page.locator(".admin-donut-legend__track").first()).toBeVisible();
    await expect(page.locator(".admin-overview__advanced").first()).toBeHidden();
    await expect(page.locator(".admin-priority-grid__categories")).toBeHidden();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  });
});
