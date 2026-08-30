import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test.setTimeout(180_000);

const frames = [
  { step: "sale", heading: "Catálogo", activeLabel: "Venda" },
  { step: "benefits", heading: "Benefícios do cliente", activeLabel: "Benefícios" },
  { step: "payment", heading: "Receber pagamento", activeLabel: "Pagamento" },
  {
    step: "success",
    heading: "Venda concluída",
    activeLabel: "Concluído"
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
  await expect(
    page.locator(".pos-sale__catalog-grid").getByRole("button", { name: /Corte de Cabelo/ })
  ).toHaveClass(/is-selected/);
  await page
    .locator(".pos-sale__catalog-grid")
    .getByRole("button", { name: /Barba Completa/ })
    .click();
  await expect(page.locator(".pos-sale__cart")).toContainText("Barba Completa");
  await page.getByRole("button", { name: "Produtos" }).click();
  await expect(page.locator(".pos-sale__empty")).toContainText("Nenhum item encontrado");
  await page.getByRole("button", { name: "Todos" }).click();
  if ((page.viewportSize()?.width ?? 1280) <= 760) {
    await page.getByRole("button", { name: /Carrinho/ }).click();
  }
  await expect(page.getByRole("button", { name: "Avançar para pagamento" })).toBeEnabled();

  await page.goto("/dev/pos?etapa=benefits");
  await expect(page.locator(".pos-customer--identified")).toContainText("Ana Manjate");
  const pointsInput = page.getByRole("spinbutton", { name: "YELAS a utilizar" });
  await expect(pointsInput).toHaveValue("300");
  await pointsInput.fill("250");
  await expect(page.locator(".pos-customer__redemption")).toContainText("250 MT");
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

  const cartButton = page.getByRole("button", { name: /Carrinho/ });
  await expect(cartButton).toBeVisible();
  await cartButton.click();
  await expect(page.getByRole("dialog", { name: "Carrinho de Vendas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Avançar para pagamento" })).toBeEnabled();
  await page.getByRole("button", { name: "Voltar ao catálogo" }).click();

  await page.getByRole("button", { name: "Abrir menu do POS" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu do POS" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Catálogo de Serviços" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expectNoHorizontalOverflow(page);
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
