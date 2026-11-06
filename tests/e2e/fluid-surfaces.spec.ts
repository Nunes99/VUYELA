import { expect, test } from "@playwright/test";

const surfaces = [
  ["publico", "/", ".marketing-site"],
  ["cliente", "/dev/customer", ".dashboard-page--customer"],
  ["negocio", "/dev/business", ".business-portal"],
  ["admin", "/dev/admin", ".admin-console"],
  ["pos", "/dev/pos?etapa=sale", ".pos-portal"]
] as const;

const captureStage = process.env.FLUID_CAPTURE_STAGE ?? "current";
if (!/^[a-z0-9-]+$/.test(captureStage)) throw new Error("Identificador de captura inválido.");

for (const [name, route, marker] of surfaces) {
  test(`fluid rollout visual evidence: ${name}`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator(marker).first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          })
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${name} overflow at ${width}px`
      ).toBe(true);
      if (name === "admin" && (await page.locator(".admin-donut").isVisible())) {
        const ring = await page.locator(".admin-donut").evaluate((element) => ({
          outer: element.getBoundingClientRect().width,
          inner: element.firstElementChild?.getBoundingClientRect().width ?? 0
        }));
        expect(ring.inner, "O centro deve caber dentro do gráfico circular").toBeLessThan(
          ring.outer
        );
      }
      if (width === 390 || width === 1440) {
        await page.screenshot({
          path: `playwright-report/fluid-evidence/${captureStage}/${name}-${testInfo.project.name}-${width}.png`,
          fullPage: true,
          scale: "css",
          caret: "initial"
        });
      }
    }
  });
}
