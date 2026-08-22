import { expect, test } from "@playwright/test";

test("shows the public homepage", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Cada compra cria uma razão para voltar." })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Quero um cartão" })).toBeVisible();
  await expect(page.getByRole("link", { name: "VUYELA by LEMOTE" }).first()).toBeVisible();
  await expect(page.getByText("Seguro & Confiável")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como funciona?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vantagens para si" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Negócios que já confiam" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Pontos VUYELA são promocionais, claros e locais ao negócio."
    })
  ).toBeVisible();
});

test("keeps the approved hierarchy across core responsive widths", async ({ page }) => {
  await page.goto("/");

  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });

    const layout = await page.evaluate(() => {
      const title = document.querySelector("h1");
      const productVisual = document.querySelector(".home-product-visual img");
      const productRect = productVisual?.getBoundingClientRect();
      const body = document.body;

      return {
        bodyFont: getComputedStyle(body).fontFamily,
        headingFont: title ? getComputedStyle(title).fontFamily : "",
        heroLines: title?.querySelectorAll(":scope > span").length ?? 0,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        productVisible:
          Boolean(productRect) &&
          productRect!.width > 0 &&
          productRect!.right > 0 &&
          productRect!.left < window.innerWidth
      };
    });

    expect(layout.overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(layout.productVisible, `product visual outside viewport at ${width}px`).toBe(true);
    expect(layout.heroLines).toBe(3);
    expect(layout.headingFont).toContain("Sora");
    expect(layout.bodyFont).toContain("Inter");
  }
});
