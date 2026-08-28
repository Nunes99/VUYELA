import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_LIVE_PORT ?? "3100";
const externalBaseUrl = process.env.E2E_BASE_URL?.trim();
const baseURL = externalBaseUrl || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e-live",
  timeout: 90_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `pnpm dev --turbopack --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI
      },
  projects: [
    {
      name: "live-chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
