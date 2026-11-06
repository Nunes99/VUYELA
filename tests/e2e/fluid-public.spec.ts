import { expect, test } from "@playwright/test";

const captureStage = process.env.FLUID_CAPTURE_STAGE ?? "current";
if (!/^[a-z0-9-]+$/.test(captureStage)) throw new Error("Identificador de captura inválido.");

test("shares public visual preferences across pages and keeps the mobile menu in the viewport", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  const site = page.locator(".marketing-site:visible");
  await expect(site).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-vy-motion", "system");
  const material = site.locator(".marketing-header__material");
  await expect(material).not.toHaveCSS("backdrop-filter", "none");
  await expect(site.getByText("Demonstração · dados ilustrativos")).toBeVisible();
  const originalViewport = page.viewportSize();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(site.locator(".rv-dashboard__chart polyline")).toHaveCSS("stroke-dashoffset", "0px");
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    );
    const metrics = await site.locator(".rv-dashboard__metrics article").evaluateAll((cards) =>
      cards.map((card) => {
        const label = card.querySelector<HTMLElement>("small")!;
        const value = card.querySelector<HTMLElement>("strong")!;
        const trend = card.querySelector<HTMLElement>("b")!;
        const text = document.createRange();
        text.selectNodeContents(value);
        const a = text.getBoundingClientRect();
        const b = trend.getBoundingClientRect();
        return {
          labelFits:
            label.scrollWidth <= label.clientWidth && label.scrollHeight <= label.clientHeight,
          valueFits:
            value.scrollWidth <= value.clientWidth && value.scrollHeight <= value.clientHeight,
          separated:
            a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
        };
      })
    );
    expect(metrics).toHaveLength(3);
    expect(
      metrics.every((metric) => metric.labelFits && metric.valueFits && metric.separated),
      `Indicadores legíveis a ${width}px: ${JSON.stringify(metrics)}`
    ).toBe(true);
  }
  if (originalViewport) await page.setViewportSize(originalViewport);
  await site.locator(".rv-dashboard").screenshot({
    path: `playwright-report/fluid-evidence/${captureStage}/public-states/demo-${test.info().project.name}.png`,
    scale: "css",
    caret: "initial"
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await site.locator(".rv-visual-preferences summary").click();
  await site.getByRole("combobox", { name: "Transparência", exact: true }).selectOption("reduce");
  await expect(material).toHaveCSS("backdrop-filter", "none");
  await site.getByRole("combobox", { name: "Movimento", exact: true }).selectOption("reduce");
  await expect(site.locator(".rv-dashboard__chart polyline")).toHaveCSS("stroke-dashoffset", "0px");
  await page.goto("/estabelecimentos");
  await expect(page.locator("html")).toHaveAttribute("data-vy-motion", "reduce");
  await expect(site).toHaveCount(1);
  await expect(site.locator(".marketing-discovery")).toHaveCSS("backdrop-filter", "none");
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 320 || width === 1440) {
      const preferences = site.locator(".rv-visual-preferences");
      await preferences.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(
        preferences.getByRole("combobox", { name: "Movimento", exact: true })
      ).toHaveValue("reduce");
      await preferences.screenshot({
        path: `playwright-report/fluid-evidence/${captureStage}/public-states/preferences-${test.info().project.name}-${width}.png`,
        scale: "css",
        caret: "initial"
      });
      await preferences.locator("summary").focus();
      await page.keyboard.press("Enter");
    }
    const menu = site.locator('summary[aria-label="Abrir navegação"]');
    if (await menu.isVisible()) {
      await menu.focus();
      await page.keyboard.press("Enter");
      const nav = site.getByRole("navigation", { name: "Navegação móvel" });
      await expect(nav).toBeVisible();
      await expect(menu).toBeFocused();
      await expect(menu).toHaveCSS("outline-width", "3px");
      const bounds = await nav.boundingBox();
      expect(bounds).not.toBeNull();
      if (width < 640) {
        expect(bounds?.x).toBe(0);
        expect(bounds?.width).toBe(width);
        expect(bounds?.y).toBe(0);
        expect(bounds?.height).toBe(900);
      } else {
        expect(bounds?.x).toBeGreaterThanOrEqual(0);
        expect((bounds?.x ?? width) + (bounds?.width ?? 1)).toBeLessThanOrEqual(width);
        expect((bounds?.y ?? 900) + (bounds?.height ?? 1)).toBeLessThanOrEqual(900);
      }
      await expect(nav.getByRole("link", { name: "Ajuda", exact: true })).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(nav.getByRole("link").first()).toBeFocused();
      await nav.screenshot({
        path: `playwright-report/fluid-evidence/${captureStage}/public-states/navigation-${test.info().project.name}-${width}.png`,
        scale: "css",
        caret: "initial"
      });
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(nav).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width
    );
  }
  await page.reload();
  await expect(site).toHaveCount(1);
  await site.locator(".rv-visual-preferences summary").click();
  await expect(site.getByRole("combobox", { name: "Movimento", exact: true })).toHaveValue(
    "reduce"
  );
  await expect(site.getByRole("combobox", { name: "Transparência", exact: true })).toHaveValue(
    "reduce"
  );
  expect(errors).toEqual([]);
});
