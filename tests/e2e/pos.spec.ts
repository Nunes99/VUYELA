import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

const protectedPosRoutes = [
  "/pos",
  "/pos/definicoes?vista=geral",
  "/pos/definicoes?vista=dispositivos",
  "/pos/definicoes?vista=impressora",
  "/pos/definicoes?vista=rede",
  "/pos/definicoes?vista=utilizadores",
  "/pos/definicoes?vista=seguranca",
  "/pos/definicoes/pagamentos?metodo=mpesa",
  "/pos/definicoes/pagamentos?metodo=emola",
  "/pos/definicoes/pagamentos?metodo=mkesh",
  "/pos/definicoes/pagamentos?metodo=dinheiro",
  "/pos/definicoes/pagamentos?metodo=cartao"
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
