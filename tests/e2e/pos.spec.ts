import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

const protectedPosRoutes = [
  "/pos",
  "/pos/definicoes?vista=geral",
  "/pos/definicoes?vista=dispositivos",
  "/pos/definicoes?vista=impressora",
  "/pos/definicoes?vista=rede",
  "/pos/definicoes?vista=utilizadores",
  "/pos/definicoes?vista=seguranca"
];

const protectedBusinessPaymentRoutes = [
  "/negocio/definicoes/pagamentos?metodo=mpesa",
  "/negocio/definicoes/pagamentos?metodo=emola",
  "/negocio/definicoes/pagamentos?metodo=mkesh",
  "/negocio/definicoes/pagamentos?metodo=dinheiro",
  "/negocio/definicoes/pagamentos?metodo=cartao"
];

test("protects the POS transaction and settings routes", async ({ page }) => {
  for (const route of protectedPosRoutes) {
    await page.goto(route);

    await expect(
      page.getByRole("heading", { name: "Não foi possível iniciar o acesso." })
    ).toBeVisible();
    await expect(page.getByText("Serviço indisponível")).toBeVisible();
  }
});

test("protects payment configuration in the business application", async ({ page }) => {
  for (const route of protectedBusinessPaymentRoutes) {
    await page.goto(route);

    await expect(
      page.getByRole("heading", { name: "Não foi possível iniciar o acesso." })
    ).toBeVisible();
    await expect(page.getByText("Serviço indisponível")).toBeVisible();
  }
});

test("redirects the legacy POS payment address to business settings", async ({ page }) => {
  await page.goto("/pos/definicoes/pagamentos?metodo=mpesa");

  await expect(page).toHaveURL(/\/negocio\/definicoes\/pagamentos\?metodo=mpesa$/);
});
