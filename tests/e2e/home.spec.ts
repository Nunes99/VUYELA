import { expect, test } from "@playwright/test";

test("shows the public homepage", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Cada compra cria uma razão para voltar." })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Quero um cartão" })).toBeVisible();
  await expect(page.getByRole("link", { name: "VUYELA by LEMOTE" }).first()).toBeVisible();
  await expect(page.getByText("Feito em Moçambique")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Simples para clientes, rentável para negócios." })
  ).toBeVisible();
  await expect(page.locator("#benefits-title")).toBeAttached();
  await expect(page.locator("#partners-title")).toBeAttached();
  expect(browserErrors).toEqual([]);
});

test("opens every NEW PHAS public page through real routes", async ({ page }) => {
  test.setTimeout(180_000);

  const pages = [
    ["/como-funciona", "Como funciona a VUYELA?"],
    ["/clientes", "O seu cartão digital de fidelização"],
    ["/negocios", "Clientes que voltam. Negócios que crescem."],
    ["/precos", "Planos para começar pequeno e crescer com controlo."],
    ["/ajuda", "Perguntas Frequentes & Suporte"]
  ] as const;

  for (const [path, heading] of pages) {
    await page.goto(path, { waitUntil: "networkidle" });
    if ((await page.locator(".marketing-site").count()) === 0) {
      await page.evaluate(async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      });
      await page.goto(path, { waitUntil: "networkidle" });
    }
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("link", { name: "VUYELA by LEMOTE" }).first()).toHaveAttribute(
      "href",
      "/"
    );
  }
});

test("keeps the approved hierarchy across core responsive widths", async ({ page }) => {
  await page.goto("/");

  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
    await expect(page.locator(".marketing-product-image")).toBeVisible();

    const layout = await page.evaluate(() => {
      const title = document.querySelector("h1");
      const productVisual = document.querySelector(".marketing-product-image");
      const productRect = productVisual?.getBoundingClientRect();
      const body = document.body;

      return {
        bodyFont: getComputedStyle(body).fontFamily,
        headingFont: title ? getComputedStyle(title).fontFamily : "",
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        productVisible:
          Boolean(productRect) &&
          productRect!.width > 0 &&
          productRect!.right > 0 &&
          productRect!.left < window.innerWidth,
        pageLinksWork: Array.from(
          document.querySelectorAll<HTMLAnchorElement>(".marketing-header a")
        ).every((link) => Boolean(link.getAttribute("href")))
      };
    });

    expect(layout.overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(layout.productVisible, `product visual outside viewport at ${width}px`).toBe(true);
    expect(layout.pageLinksWork, `missing navigation target at ${width}px`).toBe(true);
    expect(layout.headingFont).toContain("Outfit");
    expect(layout.bodyFont).toContain("Inter");
  }
});

test("opens the full-screen mobile menu and keeps every destination available", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.locator('summary[aria-label="Abrir navegação"]').click();

  const menu = page.getByRole("navigation", { name: "Navegação móvel" });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("position", "fixed");
  await expect(menu.getByRole("link", { name: "Como funciona" })).toHaveAttribute(
    "href",
    "/como-funciona"
  );
  await expect(menu.getByRole("link", { name: "Para clientes" })).toHaveAttribute(
    "href",
    "/clientes"
  );
  await expect(menu.getByRole("link", { name: "Para negócios" })).toHaveAttribute(
    "href",
    "/negocios"
  );
  await expect(menu.getByRole("link", { name: "Preços" })).toHaveAttribute("href", "/precos");
  await expect(menu.getByRole("link", { name: "Ajuda" })).toHaveAttribute("href", "/ajuda");
});
