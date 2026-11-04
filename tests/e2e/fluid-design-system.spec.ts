import { expect, test } from "@playwright/test";

test("fluid materials remain readable, responsive and keyboard accessible", async ({ page }) => {
  await page.goto("/dev/design-system");
  await expect(page.getByRole("article", { name: "Material solid" })).toHaveCSS(
    "backdrop-filter",
    "none"
  );
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const surface = page.getByRole("article", { name: "Material liquid" });
    await expect(surface).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.screenshot({
      path: `test-results/fluid-${test.info().project.name}-${width}.png`,
      fullPage: true
    });
  }
  await page.getByLabel("Transparência", { exact: true }).selectOption("reduce");
  await expect(page.getByRole("article", { name: "Material liquid" })).toHaveCSS(
    "backdrop-filter",
    "none"
  );
  await page.reload();
  await expect(page.getByLabel("Transparência", { exact: true })).toHaveValue("reduce");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("article", { name: "Material liquid" })).toHaveCSS(
    "transition-duration",
    "0s"
  );
  const trigger = page.getByRole("button", { name: "Abrir exemplo liquid", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Concluir exemplo" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Fechar", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
