import { expect, test } from "@playwright/test";

test("shows the public homepage", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Cada compra cria uma razao para voltar." })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Quero um cartao" })).toBeVisible();
  await expect(page.getByRole("link", { name: "VUYELA by LEMOTE" }).first()).toBeVisible();
  await expect(page.getByText("Seguro & Confiavel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mais valor em cada regresso." })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Voltar fica simples quando o beneficio e claro." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Pontos VUYELA sao promocionais, claros e locais ao negocio."
    })
  ).toBeVisible();
});

test("keeps the approved hierarchy across core responsive widths", async ({ page }) => {
  await page.goto("/");

  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });

    const layout = await page.evaluate(() => {
      const title = document.querySelector("h1");
      const body = document.body;

      return {
        bodyFont: getComputedStyle(body).fontFamily,
        headingFont: title ? getComputedStyle(title).fontFamily : "",
        heroLines: title?.querySelectorAll(":scope > span").length ?? 0,
        overflow: document.documentElement.scrollWidth - window.innerWidth
      };
    });

    expect(layout.overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(layout.heroLines).toBe(3);
    expect(layout.headingFont).toContain("Sora");
    expect(layout.bodyFont).toContain("Inter");
  }
});
