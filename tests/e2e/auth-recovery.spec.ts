import { expect, test } from "@playwright/test";

test("hides phone authentication while no SMS provider is configured", async ({ page }) => {
  await page.goto("/entrar");

  await expect(page.getByRole("heading", { name: "E-mail e palavra-passe" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Telefone com código" })).toHaveCount(0);
  await expect(page.locator('input[name="next"]')).toHaveValue("/conta");
});

test("protects the account router before choosing the correct dashboard", async ({ page }) => {
  await page.goto("/conta");

  await expect(page).toHaveURL(/\/entrar\?next=%2Fconta$/);
});

test("shows the complete password recovery forms", async ({ page }) => {
  await page.goto("/recuperar-acesso");

  await expect(
    page.getByRole("heading", { name: "Recupere o acesso com seguranca." })
  ).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar link" })).toBeVisible();

  await page.goto("/definir-senha");

  await expect(
    page.getByRole("heading", { name: "Defina uma nova palavra-passe segura." })
  ).toBeVisible();
  await expect(page.getByLabel(/^Nova palavra-passe/)).toBeVisible();
  await expect(page.getByLabel("Confirmar nova palavra-passe")).toBeVisible();
});

test("rejects an auth callback without a code", async ({ page }) => {
  await page.goto("/auth/callback");

  await expect(page).toHaveURL(/\/entrar\?erro=link-invalido$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "O link é inválido ou expirou." })
  ).toBeVisible();
});
