import { expect, test } from "@playwright/test";

const captureStage = process.env.FLUID_CAPTURE_STAGE ?? "current";
if (!/^[a-z0-9-]+$/.test(captureStage)) throw new Error("Identificador de captura inválido.");

test("fluid materials remain readable, responsive and keyboard accessible", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/dev/design-system");
  await expect(page.locator("html")).toHaveAttribute("data-vy-motion", "system");
  await expect(page.getByRole("article", { name: "Material solid" })).toHaveCSS(
    "backdrop-filter",
    "none"
  );
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
    const surface = page.getByRole("article", { name: "Material liquid" });
    await expect(surface).toBeVisible();
    const layout = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: Array.from(document.querySelectorAll<HTMLElement>("main *"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.right > window.innerWidth + 1 || rect.left < -1);
        })
        .slice(0, 12)
        .map((element) => ({ tag: element.tagName, className: element.className }))
    }));
    expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(width);
    const tooltipTrigger = page.getByRole("button", { name: "Descarregar", exact: true });
    await tooltipTrigger.focus();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toHaveCSS("opacity", "1");
    const tooltipBounds = await tooltip.boundingBox();
    expect(tooltipBounds?.x).toBeGreaterThanOrEqual(0);
    expect((tooltipBounds?.x ?? width) + (tooltipBounds?.width ?? 1)).toBeLessThanOrEqual(width);
    await tooltipTrigger.evaluate((element) => element.blur());
    await expect(tooltip).toHaveCSS("opacity", "0");
    await page.screenshot({
      path: `test-results/fluid-${test.info().project.name}-${width}.png`,
      fullPage: true,
      scale: "css",
      caret: "initial"
    });
    await page.getByRole("region", { name: "Fluid Design 2.0 — demonstração" }).screenshot({
      path: `playwright-report/fluid-evidence/${captureStage}/foundations/${test.info().project.name}-${width}.png`,
      animations: "disabled",
      scale: "css",
      caret: "initial"
    });
  }
  await page.getByRole("combobox", { name: "Transparência", exact: true }).selectOption("reduce");
  await expect(page.getByRole("article", { name: "Material liquid" })).toHaveCSS(
    "backdrop-filter",
    "none"
  );
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Transparência", exact: true })).toHaveValue(
    "reduce"
  );
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
  const customerTab = page.getByRole("tab", { name: "Cliente", exact: true });
  await customerTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Negócio", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("Clientes, campanhas e programa.");
  await page.keyboard.press("Home");
  await expect(customerTab).toBeFocused();
  await page.getByRole("combobox", { name: "Transparência", exact: true }).selectOption("system");
  await expect(page.getByRole("article", { name: "Material liquid" })).not.toHaveCSS(
    "backdrop-filter",
    "none"
  );
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.getByRole("article", { name: "Material liquid" })).toHaveCSS(
    "backdrop-filter",
    "none"
  );
  expect(errors).toEqual([]);
});
