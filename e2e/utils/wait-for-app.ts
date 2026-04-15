import {expect, Page} from "@playwright/test";

/** Wait for the app to settle after navigation. */
export async function waitForApp(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("#root")).not.toBeEmpty();
}