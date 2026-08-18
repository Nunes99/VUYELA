import { expect, test } from "@playwright/test";

test("hides phone authentication while no SMS provider is configured", async ({ page }) => {
  await page.goto("/entrar");

  await expect(page.getByRole("heading", { name: "Email e senha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Telefone com codigo" })).toHaveCount(0);
});

test("shows the complete password recovery forms", async ({ page }) => {
  await page.goto("/recuperar-acesso");

  await expect(
    page.getByRole("heading", { name: "Recupere o acesso com seguranca." })
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar link" })).toBeVisible();

  await page.goto("/definir-senha");

  await expect(page.getByRole("heading", { name: "Defina uma nova senha segura." })).toBeVisible();
  await expect(page.getByLabel(/^Nova senha/)).toBeVisible();
  await expect(page.getByLabel("Confirmar nova senha")).toBeVisible();
});

test("rejects an auth callback without a code", async ({ page }) => {
  await page.goto("/auth/callback");

  await expect(page).toHaveURL(/\/entrar\?erro=link-invalido$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "O link e invalido ou expirou." })
  ).toBeVisible();
});
