import { test, expect } from "@playwright/test";

test("app loads and renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Clawmark");
  await expect(page.locator("#root")).not.toBeEmpty();
});
