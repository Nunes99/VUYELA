import { expect, test } from "@playwright/test";

const surfaces = [
  ["publico", "/"],
  ["cliente", "/dev/customer"],
  ["negocio", "/dev/business"],
  ["admin", "/dev/admin"],
  ["pos", "/dev/pos?etapa=sale"]
] as const;

for (const [name, route] of surfaces) {
  test(`fluid rollout visual evidence: ${name}`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${name} overflow at ${width}px`
      ).toBe(true);
      if (width === 390 || width === 1440) {
        const stage = process.env.FLUID_CAPTURE_STAGE === "before" ? "before" : "after";
        await page.screenshot({
          path: `playwright-report/fluid-evidence/${stage}/${name}-${testInfo.project.name}-${width}.png`,
          fullPage: true
        });
      }
    }
  });
}
