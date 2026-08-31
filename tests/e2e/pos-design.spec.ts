import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test.setTimeout(180_000);

const frames = [
  { step: "sale", heading: "Catálogo", activeLabel: "Benefício" },
  { step: "benefits", heading: "Benefícios do cliente", activeLabel: "Benefício" },
  { step: "payment", heading: "Receber pagamento", activeLabel: "Pagamento" },
  {
    step: "success",
    heading: "Venda concluída",
    activeLabel: "Conclusão"
  }
] as const;

const settingsFrames = [
  ["geral", "Definições Gerais", "Geral"],
  ["dispositivos", "Dispositivos Conectados", "Dispositivos"],
  ["impressora", "Impressoras", "Impressora"],
  ["rede", "Rede e Conectividade", "Rede"],
  ["utilizadores", "Gestão de Utilizadores", "Utilizadores"],
  ["seguranca", "Segurança e Acesso", "Segurança"]
] as const;

const paymentFrames = [
  ["mpesa", "M-Pesa — Configuração", "M-Pesa"],
  ["emola", "e-Mola — Configuração", "e-Mola"],
  ["mkesh", "Mkesh — Configuração", "Mkesh"],
  ["dinheiro", "Dinheiro — Configuração", "Dinheiro"],
  ["cartao", "Cartão — Configuração", "Cartão"]
] as const;

test("renders the cart-first POS frames without horizontal overflow", async ({ page }) => {
  for (const frame of frames) {
    await page.goto(`/dev/pos?etapa=${frame.step}`);

    await expect(page.getByRole("heading", { name: frame.heading })).toBeVisible();
    await expect(page.locator(".pos-sale__progress li.is-active")).toContainText(frame.activeLabel);
    await expect(page.locator(".pos-sale")).toBeVisible();

    const viewport = page.viewportSize();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    if (viewport && viewport.width >= 1080) {
      const columns =
        frame.step === "sale"
          ? [page.locator(".pos-sale__catalog"), page.locator(".pos-sale__cart")]
          : frame.step === "success"
            ? []
            : [page.locator(".pos-checkout__main"), page.locator(".pos-order")];
      if (columns.length === 2) {
        const left = await columns[0]!.boundingBox();
        const right = await columns[1]!.boundingBox();
        expect(left).not.toBeNull();
        expect(right).not.toBeNull();
        expect(right?.x ?? 0).toBeGreaterThan((left?.x ?? 0) + (left?.width ?? 0));
      }
    }
  }
});

test("keeps catalogue, loyalty and payment controls functional", async ({ page }) => {
  await page.goto("/dev/pos?etapa=sale");
  const catalogueCards = page.locator(".pos-catalog-item");
  await expect(catalogueCards).toHaveCount(4);
  await expect(catalogueCards.first().locator(".pos-sale__item-media")).toBeVisible();
  await expect(catalogueCards.nth(1).locator(".pos-sale__item-count")).toHaveText("1");
  await expect(catalogueCards.nth(2).locator(".pos-sale__item-count")).toHaveText("0");
  await expect(catalogueCards.first().locator(".pos-sale__item-count")).toHaveText("1");

  const addControlShape = await catalogueCards
    .nth(2)
    .getByRole("button", { name: "Adicionar uma unidade de Lavagem Capilar" })
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderRadius: style.borderRadius,
        height: element.getBoundingClientRect().height,
        width: element.getBoundingClientRect().width
      };
    });
  expect(addControlShape.width).toBe(addControlShape.height);
  expect(addControlShape.borderRadius).not.toBe("0px");

  await expect(catalogueCards.first()).toHaveClass(/is-selected/);
  await catalogueCards
    .nth(2)
    .getByRole("button", { name: "Adicionar uma unidade de Lavagem Capilar" })
    .click();
  await expect(page.locator(".pos-sale__cart")).toContainText("Lavagem Capilar");
  await page.getByRole("button", { name: "Produtos" }).click();
  await expect(page.locator(".pos-sale__empty")).toContainText("Nenhum item encontrado");
  await page.getByRole("button", { name: "Todos" }).click();
  if ((page.viewportSize()?.width ?? 1280) <= 760) {
    await page.getByRole("button", { name: /Carrinho/ }).click();
  }
  await expect(page.getByRole("button", { name: "Avançar para Pagamento" })).toBeEnabled();

  await page.goto("/dev/pos?etapa=benefits");
  await expect(page.locator(".pos-customer--identified")).toContainText("Ana Manjate");
  const pointsInput = page.getByRole("spinbutton", { name: "YELAS a utilizar" });
  await expect(pointsInput).toHaveValue("300");
  await pointsInput.fill("250");
  await expect(page.locator(".pos-customer__redemption")).toContainText("250 MZN");
  await expect(page.getByRole("button", { name: "Recalcular" })).toBeEnabled();
  await expect(page.locator(".pos-order")).toContainText("300 YL utilizados");

  await page.goto("/dev/pos?etapa=payment");
  await expect(page.getByRole("radio", { name: /Numerário/ })).toHaveAttribute(
    "aria-checked",
    "true"
  );
  await page.getByRole("radio", { name: /Cartão bancário/ }).click();
  await expect(page.getByText("Referência do terminal bancário")).toBeVisible();

  const authorization = page.getByRole("checkbox");
  const confirmButton = page.getByRole("button", { name: "Confirmar pagamento" });
  await expect(confirmButton).toBeDisabled();
  await authorization.check();
  await expect(confirmButton).toBeEnabled();
  await page.getByRole("button", { name: "Benefícios" }).click();
  await expect(page.getByRole("heading", { name: "Benefícios do cliente" })).toBeVisible();
});

test("uses the Figma mobile catalogue, cart and navigation drawer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile POS contract");

  await page.goto("/dev/pos?etapa=sale");
  await expect(page.locator(".pos-sale__catalog-grid")).toBeVisible();
  await expect(page.locator(".pos-sale__cart")).toBeHidden();
  await expect(page.getByText("Nova venda")).toHaveCount(0);
  await expect(page.getByText("Meu salão")).toHaveCount(0);

  const brand = page.locator(".pos-portal__brand");
  const brandBox = await brand.boundingBox();
  const headerBox = await page.locator(".pos-portal__header").boundingBox();
  const brandLayout = await brand.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    whiteSpace: getComputedStyle(element).whiteSpace
  }));
  expect(brandBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect((brandBox?.y ?? 0) + (brandBox?.height ?? 0)).toBeLessThanOrEqual(
    (headerBox?.y ?? 0) + (headerBox?.height ?? 0)
  );
  expect(brandLayout.whiteSpace).toBe("nowrap");
  expect(brandLayout.scrollWidth).toBeLessThanOrEqual(Math.ceil(brandBox?.width ?? 0));

  const mobileProgressLabels = page.locator(".pos-sale__progress-label--mobile");
  await expect(mobileProgressLabels.nth(0)).toHaveText("Venda");
  await expect(mobileProgressLabels.nth(1)).toHaveText("Benefício");
  await expect(mobileProgressLabels.nth(2)).toHaveText("Pagar");
  for (let index = 0; index < 3; index += 1) {
    await expect(mobileProgressLabels.nth(index)).toBeVisible();
  }

  const cards = page.locator(".pos-catalog-item");
  const firstCard = await cards.first().boundingBox();
  const secondCard = await cards.nth(1).boundingBox();
  expect(firstCard).not.toBeNull();
  expect(secondCard).not.toBeNull();
  expect(secondCard?.y).toBe(firstCard?.y);
  expect(secondCard?.x ?? 0).toBeGreaterThan((firstCard?.x ?? 0) + (firstCard?.width ?? 0));
  expect(Math.abs((secondCard?.height ?? 0) - (firstCard?.height ?? 0))).toBeLessThanOrEqual(1);

  const priceBox = await cards.first().locator(".pos-sale__item-price-action > b").boundingBox();
  const quantityBox = await cards.first().locator(".pos-sale__item-quantity-control").boundingBox();
  expect(priceBox).not.toBeNull();
  expect(quantityBox).not.toBeNull();
  expect(quantityBox?.y ?? 0).toBeGreaterThanOrEqual((priceBox?.y ?? 0) + (priceBox?.height ?? 0));
  await expect(cards.first()).toContainText("MZN");

  await cards.nth(1).getByRole("button", { name: "Retirar uma unidade de Barba Completa" }).click();

  const cartButton = page.getByRole("button", { name: /Carrinho/ });
  await expect(cartButton).toBeVisible();
  await expect(cartButton).toContainText("1");
  await cartButton.click();
  const mobileCart = page.getByRole("dialog", { name: "Carrinho de Vendas" });
  await expect(mobileCart).toBeVisible();
  const checkoutButton = page.getByRole("button", { name: "Avançar para Pagamento" });
  await expect(checkoutButton).toBeEnabled();
  const checkoutBox = await checkoutButton.boundingBox();
  const viewport = page.viewportSize();
  expect(checkoutBox).not.toBeNull();
  expect((checkoutBox?.y ?? 0) + (checkoutBox?.height ?? 0)).toBeLessThanOrEqual(
    viewport?.height ?? 0
  );
  const cartLinesLayout = await mobileCart
    .locator(".pos-mobile-cart__lines")
    .evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight
    }));
  expect(cartLinesLayout.scrollHeight).toBeLessThanOrEqual(cartLinesLayout.clientHeight);
  await page.getByRole("button", { name: "Voltar ao catálogo" }).click();

  await page.getByRole("button", { name: "Abrir menu do POS" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu do POS" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Catálogo de Serviços" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(drawer.getByRole("link", { name: "Nova Transação" })).toHaveCount(0);
  const drawerLinks = drawer.getByRole("link");
  const drawerLinkCount = await drawerLinks.count();
  for (let index = 0; index < drawerLinkCount; index += 1) {
    await expect(drawerLinks.nth(index)).toBeVisible();
  }
  const drawerLayout = await drawer.evaluate((element) => {
    const footer = element.querySelector(".pos-drawer__footer");
    const footerBox = footer?.getBoundingClientRect();
    return {
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      footerBottom: footerBox?.bottom ?? Number.POSITIVE_INFINITY
    };
  });
  expect(drawerLayout.scrollHeight).toBeLessThanOrEqual(drawerLayout.clientHeight);
  expect(drawerLayout.footerBottom).toBeLessThanOrEqual(viewport?.height ?? 0);
  await expectNoHorizontalOverflow(page);
});

test("keeps the terminal area active in the POS menu", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile POS contract");

  await page.goto("/dev/pos?ecra=definicoes&vista=geral");
  await page.getByRole("button", { name: "Abrir menu do POS" }).click();

  const drawer = page.getByRole("dialog", { name: "Menu do POS" });
  await expect(drawer.getByRole("link", { name: "Terminal POS" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(drawer.getByRole("link", { name: "Catálogo de Serviços" })).not.toHaveAttribute(
    "aria-current",
    "page"
  );
});

test("renders every settings and payment frame without horizontal overflow", async ({ page }) => {
  const viewport = page.viewportSize();
  const isMobile = Boolean(viewport && viewport.width <= 760);

  for (const [view, heading, mobileLabel] of settingsFrames) {
    await page.goto(`/dev/pos?ecra=definicoes&vista=${view}`);
    await expect(page.locator(".pos-figma-settings-layout")).toBeVisible();
    if (isMobile) {
      await expect(page.locator(".pos-figma-mobile-breadcrumb")).toContainText(mobileLabel);
    } else {
      await expect(page.getByRole("heading", { exact: true, name: heading })).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
  }

  for (const [method, heading, mobileLabel] of paymentFrames) {
    await page.goto(`/dev/pos?ecra=pagamentos&metodo=${method}`);
    await expect(page.locator(".pos-figma-settings-layout")).toBeVisible();
    if (isMobile) {
      await expect(page.locator(".pos-figma-mobile-breadcrumb")).toContainText(mobileLabel);
    } else {
      await expect(page.getByRole("heading", { exact: true, name: heading })).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
  }

  if (isMobile) {
    await expect(page.locator(".pos-figma-mobile-nav")).toBeVisible();
    await expect(page.locator(".pos-figma-side-links")).toBeHidden();
    await expect(page.locator(".pos-figma-mobile-nav nav a")).toHaveCount(5);
  } else {
    await expect(page.locator(".pos-figma-side-links")).toBeVisible();
    await expect(page.locator(".pos-figma-mobile-nav")).toBeHidden();
  }
});

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}
