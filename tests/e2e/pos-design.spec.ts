import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

const frames = [
  { step: "identify", heading: "Nova transação", activeLabel: "Identificar" },
  { step: "services", heading: "Selecione os Serviços", activeLabel: "Serviços" },
  { step: "authorize", heading: "Autorizar Pagamento", activeLabel: "Autorizar" },
  { step: "confirm", heading: "Confirmar Transação", activeLabel: "Confirmar" },
  {
    step: "success",
    heading: "Transação concluída com sucesso!",
    activeLabel: "Concluído"
  }
] as const;

test("renders the five approved POS frames without horizontal overflow", async ({ page }) => {
  for (const frame of frames) {
    await page.goto(`/dev/pos?etapa=${frame.step}`);

    await expect(page.getByRole("heading", { name: frame.heading })).toBeVisible();
    await expect(page.locator(".pos-steps li.is-active")).toContainText(frame.activeLabel);
    await expect(page.locator(".pos-panel")).toBeVisible();
    await expect(page.locator(".pos-summary")).toBeVisible();

    if (frame.step !== "identify" && frame.step !== "success") {
      await expect(page.locator(".pos-flow-controls")).toBeVisible();
    }

    const viewport = page.viewportSize();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    if (viewport && viewport.width >= 1080) {
      const panel = await page.locator(".pos-panel").boundingBox();
      const summary = await page.locator(".pos-summary").boundingBox();

      expect(panel).not.toBeNull();
      expect(summary).not.toBeNull();
      expect(summary?.x ?? 0).toBeGreaterThan((panel?.x ?? 0) + (panel?.width ?? 0));
    }
  }
});

test("keeps lookup, catalogue, payment and confirmation controls functional", async ({ page }) => {
  await page.goto("/dev/pos?etapa=identify");
  await page.getByRole("radio", { name: "Nº Cartão" }).click();
  await expect(page.getByLabel("Número do cartão *")).toBeVisible();
  await expect(page.getByLabel("Pré-visualização da câmara para leitura QR")).toHaveCount(0);

  await page.goto("/dev/pos?etapa=services");
  await expect(page.getByRole("radio", { name: /Corte de Cabelo/ })).toHaveAttribute(
    "aria-checked",
    "true"
  );
  await page.getByRole("radio", { name: /Barba Completa/ }).click();
  await expect(page.locator(".pos-summary--services")).toContainText("Barba Completa");
  const usePoints = page.getByRole("checkbox", {
    name: /Usar YELAS como parte do pagamento/
  });
  await usePoints.check();
  const pointsInput = page.getByRole("spinbutton", { name: "YELAS a utilizar" });
  await expect(pointsInput).toHaveValue("400");
  await pointsInput.fill("250");
  await expect(page.locator(".pos-loyalty-manager__preview")).toContainText("250 MT");
  await expect(page.locator(".pos-loyalty-manager__preview")).toContainText("550 MT");
  await expect(page.locator(".pos-loyalty-manager__preview")).toContainText("+55 YL");
  await expect(page.getByRole("button", { name: "Confirmar Serviços selecionados" })).toBeEnabled();

  await page.goto("/dev/pos?etapa=authorize");
  await expect(page.locator(".pos-summary--values")).toContainText("300 YL");
  await expect(page.locator(".pos-summary--values")).toContainText("1.100 MT");
  await expect(page.locator(".pos-summary--values")).toContainText("+110 YL");
  await expect(page.getByRole("radio", { name: /Dinheiro/ })).toHaveAttribute(
    "aria-checked",
    "true"
  );
  await page.getByRole("radio", { name: /^Cartão/ }).click();
  await page.getByRole("button", { name: "Prosseguir para Resumo" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar Transação" })).toBeVisible();
  await expect(page.locator(".pos-confirmation-list--review")).toContainText("300 YL");
  await expect(page.locator(".pos-confirmation-list--review")).toContainText("+110 YL");

  const authorization = page.getByRole("checkbox");
  const confirmButton = page.getByRole("button", { name: "Confirmar Pagamento" });
  await expect(confirmButton).toBeDisabled();
  await authorization.check();
  await expect(confirmButton).toBeEnabled();

  await page.getByRole("button", { name: "Voltar ao pagamento" }).click();
  await expect(page.getByRole("heading", { name: "Autorizar Pagamento" })).toBeVisible();
});
