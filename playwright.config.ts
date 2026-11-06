import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e-setup.ts",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL,
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: `node scripts/playwright-server.mjs ${port}`,
    url: `${baseURL}/dev/design-system`,
    // Includes the production build; request/test timeouts remain unchanged.
    timeout: 900_000,
    reuseExistingServer: false,
    stdout: "pipe",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
      NEXT_PUBLIC_PWA_TEST: "true",
      VERCEL: "",
      VERCEL_ENV: "development"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] }
    }
  ]
});
