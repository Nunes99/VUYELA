import { expect, test } from "@playwright/test";

test("keeps the NEW PHAS customer composition across desktop and mobile", async ({ page }) => {
  test.setTimeout(120_000);

  for (const viewport of [
    { width: 1440, height: 1000, mobile: false },
    { width: 390, height: 844, mobile: true }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/dev/customer");

    await expect(page.getByRole("heading", { name: "Olá, Nunes José" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Seus Cartões" })).toBeVisible();
    await expect(page.getByLabel("Navegação do cliente")).toBeVisible();

    if (viewport.mobile) {
      await expect(page.getByRole("link", { name: "Negócios" })).toBeVisible();
      await expect(page.getByRole("link", { name: "POS" })).toBeVisible();
    }

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      mobileTotalVisible:
        getComputedStyle(document.querySelector<HTMLElement>(".customer-mobile-total")!).display !==
        "none",
      desktopSummaryVisible:
        getComputedStyle(document.querySelector<HTMLElement>(".customer-summary-grid--wide")!)
          .display !== "none"
    }));

    expect(layout.overflow).toBeLessThanOrEqual(0);
    expect(layout.mobileTotalVisible).toBe(viewport.mobile);
    expect(layout.desktopSummaryVisible).toBe(!viewport.mobile);
  }
});

test("renders the customer activity, notifications and card identification views", async ({
  page
}, testInfo) => {
  await page.goto("/dev/customer?vista=atividade");
  if (testInfo.project.name === "mobile-chrome") {
    await expect(page.getByRole("heading", { name: "Histórico de Pontos" })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Pesquisar atividade" })).toBeVisible();
    await expect(page.getByText("Barbershop 21", { exact: true }).first()).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", { name: "Histórico de Atividade" }).last()
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Cartão vinculado" })).toBeVisible();
  }

  await page.goto("/dev/customer?vista=notificacoes");
  await expect(page.getByRole("heading", { name: "Avisos e Alertas" }).last()).toBeVisible();
  await expect(page.getByText("Pontos acumulados", { exact: true })).toBeVisible();

  await page.goto("/dev/customer?vista=cartoes&cartao=card-1");
  await expect(page.locator('[aria-label^="QR de identificação:"]:visible')).toBeVisible();
  await page.locator('button[aria-label="Mostrar o verso do cartão"]:visible').click();
  await expect(
    page.locator('[role="img"][aria-label="Verso do cartão Barbershop 21"]:visible')
  ).toBeVisible();
});

test("matches the referenced mobile customer flow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile-only design contract");
  test.setTimeout(180_000);

  await page.goto("/dev/customer?vista=cartoes");
  await expect(page.getByRole("heading", { name: "Gerir Cartões" })).toBeVisible();
  await expect(page.getByText("Adicionar novo cartão digital")).toBeVisible();
  await expect(page.locator(".customer-mobile-header__logo")).toHaveAttribute("href", "/cliente");

  await page.goto("/dev/customer?vista=ofertas");
  await expect(page.getByRole("heading", { name: "Explorar Ofertas" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Todas" })).toBeVisible();
  await page.getByRole("button", { name: "Saúde" }).click();
  await expect(page.getByText("Farmácia Central", { exact: true })).toBeVisible();
  await expect(page.getByText("Restaurante Marés", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ver oferta" }).first()).toBeVisible();

  await page.goto("/dev/customer?vista=perfil");
  await expect(page.getByRole("heading", { name: "O Seu Perfil" }).first()).toBeVisible();
  await expect(page.getByText("Segurança e preferências", { exact: true })).toBeVisible();

  await page.goto("/dev/customer?vista=perfil&editar=1");
  const consent = page.getByRole("checkbox", { name: "Comunicações de benefícios" });
  await expect(consent).toBeVisible();
  const checkboxSize = await consent.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(checkboxSize.width).toBeGreaterThanOrEqual(20);
  expect(checkboxSize.height).toBeGreaterThanOrEqual(20);
});
