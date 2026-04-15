import { defineConfig, devices } from "@playwright/test";

const PORT = 1421;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: `http://localhost:${PORT}`,
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `npx vite --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
