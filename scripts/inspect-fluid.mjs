import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const stage = process.argv[2] ?? "inspection";
const route = process.argv[3] ?? "/dev/design-system";
const width = Number(process.argv[4] ?? "320");
if (!/^[a-z0-9-]+$/.test(stage)) throw new Error("Identificador de captura inválido.");
if (
  !route.startsWith("/") ||
  route.startsWith("//") ||
  !Number.isInteger(width) ||
  width < 320 ||
  width > 1440
) {
  throw new Error("Rota ou largura de inspeção inválida.");
}
const output = `playwright-report/fluid-evidence/${stage}`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto(`http://127.0.0.1:3100${route}`);
  if (response?.status() !== 200) throw new Error(`Demonstrador: HTTP ${response?.status()}.`);
  await page.locator("main").first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: Array.from(document.querySelectorAll("main *"))
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && (bounds.right > innerWidth + 1 || bounds.left < -1);
      })
      .slice(0, 25)
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          className: element.className,
          width: bounds.width,
          right: bounds.right,
          parent: element.parentElement?.className,
          minWidth: style.minWidth,
          grid: style.gridTemplateColumns
        };
      })
  }));
  await page.screenshot({
    path: `${output}/full-${width}.png`,
    fullPage: true,
    scale: "css",
    caret: "initial"
  });
  if (route === "/dev/design-system") {
    await page.getByRole("region", { name: "Fluid Design 2.0 — demonstração" }).screenshot({
      path: `${output}/foundations-${width}.png`,
      animations: "disabled",
      scale: "css",
      caret: "initial"
    });
    const transparency = page.getByRole("combobox", { name: "Transparência", exact: true });
    console.log(
      JSON.stringify({
        labelMatches: await page.getByLabel("Transparência", { exact: true }).count(),
        roleMatches: await transparency.count()
      })
    );
    await transparency.selectOption("reduce", { timeout: 5000 });
    await expect(page.locator("html")).toHaveAttribute("data-vy-transparency", "reduce");
    await page.reload();
    await expect(transparency).toHaveValue("reduce");
    await transparency.selectOption("system");
    const trigger = page.getByRole("button", { name: "Abrir exemplo liquid", exact: true });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Concluir exemplo" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  if (route === "/dev/admin") {
    await page
      .locator(".admin-panel")
      .filter({ has: page.locator(".admin-donut-layout") })
      .screenshot({
        path: `${output}/payment-chart-${width}.png`,
        scale: "css",
        caret: "initial"
      });
  }
  await writeFile(`${output}/layout-${width}.json`, JSON.stringify({ ...layout, errors }, null, 2));
  console.log(JSON.stringify({ browser: browser.version(), ...layout, errors }, null, 2));
  expect(errors).toEqual([]);
} finally {
  await browser.close();
}
