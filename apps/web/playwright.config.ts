import { defineConfig, devices } from "@playwright/test"

const isCI = !!process.env.CI
// Not 3000, so a run never reuses the dev server and its database by mistake.
const E2E_PORT = 3100
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // Reset the database before the server starts: the build prerenders pages from it.
    command: isCI
      ? `pnpm test:e2e:db:reset && pnpm build && pnpm start --port ${E2E_PORT}`
      : `pnpm test:e2e:db:reset && pnpm dev --port ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 600_000,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://ccca:ccca@localhost:5432/ccca_e2e",
      NEXT_PUBLIC_URL: E2E_BASE_URL,
      // Empty values win over .env, so uploads stay on disk and emails only get logged.
      S3_BUCKET: "",
      SES_FROM_ADDRESS: "",
    },
  },
})
