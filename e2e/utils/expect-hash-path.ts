import {expect, Page} from "@playwright/test";

/** Assert that the current hash path matches the expected pattern. */
export async function expectHashPath(page: Page, pattern: RegExp) {
  await expect(page).toHaveURL(pattern);
}