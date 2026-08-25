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

      const cardAlignment = await page.evaluate(() => {
        const heading = document.querySelector<HTMLElement>("#home-cards-title")!;
        const firstCard = document.querySelector<HTMLElement>(".customer-home-card-link")!;

        return firstCard.getBoundingClientRect().left - heading.getBoundingClientRect().left;
      });

      expect(cardAlignment).toBeGreaterThanOrEqual(0);
      expect(cardAlignment).toBeLessThanOrEqual(12);
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

    if (!viewport.mobile) {
      const activityRows = await page
        .locator(".customer-home-activity .customer-activity-preview article")
        .evaluateAll((rows) =>
          rows.map((row) => {
            const copy = row.querySelector<HTMLElement>(":scope > div")!;
            const amount = row.querySelector<HTMLElement>(".customer-activity-preview__amount")!;
            const copyBounds = copy.getBoundingClientRect();
            const amountBounds = amount.getBoundingClientRect();

            return {
              amountFits:
                amount.scrollWidth <= amount.clientWidth &&
                amount.scrollHeight <= amount.clientHeight,
              separated: amountBounds.left >= copyBounds.right
            };
          })
        );

      expect(activityRows.length).toBeGreaterThan(0);
      expect(activityRows.every((row) => row.amountFits && row.separated)).toBe(true);
    }
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
  const cardDetailSelector =
    testInfo.project.name === "mobile-chrome"
      ? ".customer-mobile-card-detail"
      : ".customer-card-detail-visual";
  const visibleQr = page.locator('[aria-label^="QR de identificação:"]:visible');
  await expect(visibleQr).toBeVisible();
  const qrGeometry = await visibleQr.evaluate((qr) => {
    const bounds = qr.getBoundingClientRect();
    const viewBox = (qr as SVGSVGElement).viewBox.baseVal;

    return {
      height: bounds.height,
      moduleGridWidth: viewBox.width,
      width: bounds.width
    };
  });
  expect(qrGeometry.width).toBeGreaterThanOrEqual(64);
  expect(qrGeometry.height).toBeGreaterThanOrEqual(64);
  expect(qrGeometry.moduleGridWidth).toBeLessThanOrEqual(25);
  const detailGeometry = await page
    .locator(`${cardDetailSelector} .customer-digital-card`)
    .evaluate((card) => {
      const surface = card.querySelector<HTMLElement>(".customer-digital-card__surface")!;
      const inner = card.querySelector<HTMLElement>(".customer-digital-card__inner")!;
      const face = card.querySelector<HTMLElement>(".customer-digital-card__face--front")!;

      return {
        surfaceHeight: surface.getBoundingClientRect().height,
        innerHeight: inner.getBoundingClientRect().height,
        faceHeight: face.getBoundingClientRect().height
      };
    });
  expect(Math.abs(detailGeometry.surfaceHeight - detailGeometry.innerHeight)).toBeLessThan(1);
  expect(Math.abs(detailGeometry.surfaceHeight - detailGeometry.faceHeight)).toBeLessThan(1);
  await page.locator('button[aria-label="Mostrar o verso do cartão"]:visible').click();
  await expect(
    page.locator('[role="img"][aria-label="Verso do cartão Barbershop 21"]:visible')
  ).toBeVisible();
  const backFields = await page
    .locator(`${cardDetailSelector} .customer-digital-card__back-content > span`)
    .evaluateAll((fields) =>
      fields.map((field) => {
        const value = field.querySelector<HTMLElement>("strong")!;
        return {
          complete:
            value.scrollHeight <= value.clientHeight && value.scrollWidth <= value.clientWidth,
          width: field.clientWidth
        };
      })
    );
  expect(backFields).toHaveLength(4);
  expect(
    backFields.every((field) => field.complete && field.width > 100),
    JSON.stringify(backFields)
  ).toBe(true);
});

test("matches the referenced mobile customer flow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile-only design contract");
  test.setTimeout(180_000);

  await page.goto("/dev/customer?vista=cartoes");
  await expect(page.getByRole("heading", { name: "Gerir Cartões" })).toBeVisible();
  await expect(page.getByText("Adicionar novo cartão digital")).toBeVisible();
  await expect(page.locator(".customer-mobile-header__logo")).toHaveAttribute("href", "/cliente");
  const thumbnailGeometry = await page
    .locator(".customer-card-hub-item")
    .first()
    .evaluate((row) => {
      const surface = row.querySelector<HTMLElement>(".customer-digital-card__surface")!;
      const face = row.querySelector<HTMLElement>(".customer-digital-card__face--front")!;
      const surfaceRect = surface.getBoundingClientRect();
      const faceRect = face.getBoundingClientRect();

      return {
        clippedBottom: Math.abs(surfaceRect.bottom - faceRect.bottom) > 0.5,
        radius: Number.parseFloat(getComputedStyle(face).borderRadius)
      };
    });
  expect(thumbnailGeometry.clippedBottom).toBe(false);
  expect(thumbnailGeometry.radius).toBeLessThanOrEqual(5);

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
