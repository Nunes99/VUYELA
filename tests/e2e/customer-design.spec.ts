import { expect, test } from "@playwright/test";

test("keeps the NEW PHAS customer composition across desktop and mobile", async ({ page }) => {
  await page.goto("/dev/customer");

  for (const viewport of [
    { width: 1440, height: 1000, mobile: false },
    { width: 390, height: 844, mobile: true }
  ]) {
    await page.setViewportSize(viewport);
    await page.reload();

    await expect(page.getByRole("heading", { name: "Olá, Nunes José" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Seus Cartões Digitais" })).toBeVisible();
    await expect(page.getByLabel("Navegação do cliente")).toBeVisible();

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      mobileTotalVisible:
        getComputedStyle(document.querySelector<HTMLElement>(".customer-mobile-total")!).display !==
        "none",
      desktopSummaryVisible:
        getComputedStyle(
          document.querySelector<HTMLElement>(".customer-summary-grid--wide")!
        ).display !== "none"
    }));

    expect(layout.overflow).toBeLessThanOrEqual(0);
    expect(layout.mobileTotalVisible).toBe(viewport.mobile);
    expect(layout.desktopSummaryVisible).toBe(!viewport.mobile);
  }
});

test("renders the customer activity, notifications and card identification views", async ({
  page
}) => {
  await page.goto("/dev/customer?vista=atividade");
  await expect(page.getByRole("heading", { name: "Histórico de Atividade" }).last()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Cartão vinculado" })).toBeVisible();

  await page.goto("/dev/customer?vista=notificacoes");
  await expect(page.getByRole("heading", { name: "Avisos e Alertas" }).last()).toBeVisible();
  await expect(page.getByText("Pontos acumulados", { exact: true })).toBeVisible();

  await page.goto("/dev/customer?vista=cartoes&cartao=card-1");
  await page.getByRole("button", { name: "Mostrar o verso do cartão" }).click();
  await expect(page.getByLabel("Verso do cartão Barbershop 21")).toBeVisible();
  await expect(page.getByLabel(/QR de identificação/)).toBeVisible();
});
