import { expect, test, type Page } from "@playwright/test";

interface LiveAccount {
  email: string | undefined;
  password: string | undefined;
  loginPath: string;
  destination: RegExp;
}

const accounts: Record<string, LiveAccount> = {
  customer: {
    email: process.env.E2E_CUSTOMER_EMAIL,
    password: process.env.E2E_CUSTOMER_PASSWORD,
    loginPath: "/cliente/entrar",
    destination: /\/cliente(?:\?|$)/
  },
  business: {
    email: process.env.E2E_BUSINESS_EMAIL,
    password: process.env.E2E_BUSINESS_PASSWORD,
    loginPath: "/negocio/entrar",
    destination: /\/negocio(?:\?|$)/
  },
  pos: {
    email: process.env.E2E_POS_EMAIL,
    password: process.env.E2E_POS_PASSWORD,
    loginPath: "/pos/entrar",
    destination: /\/pos(?:\?|$)/
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
    loginPath: "/admin/entrar",
    destination: /\/admin(?:\/mfa|\?|$)/
  }
};

for (const [portal, account] of Object.entries(accounts)) {
  test(`authenticates a dedicated ${portal} account in its own portal`, async ({ page }) => {
    test.skip(!account.email || !account.password, `Missing ${portal} E2E credentials`);

    await signIn(page, account);
    await expect(page).toHaveURL(account.destination);
  });
}

test("rejects customer credentials in the business portal", async ({ page }) => {
  const customer = accounts.customer;
  test.skip(!customer.email || !customer.password, "Missing customer E2E credentials");

  await signIn(page, { ...customer, loginPath: "/negocio/entrar" });
  await expect(page.getByRole("alert")).toContainText(
    "Estas credenciais não pertencem a uma conta de negócio"
  );
});

test("reports the application and database as ready", async ({ request }) => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Missing Supabase E2E configuration"
  );

  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    service: "vuyela-web",
    state: "ready"
  });
});

async function signIn(page: Page, account: LiveAccount) {
  await page.goto(account.loginPath);
  await page.locator('input[name="email"]').fill(account.email ?? "");
  await page.locator('input[name="password"]').fill(account.password ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
}
