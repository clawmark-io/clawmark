import type {Page} from "@playwright/test";

/** Click a sidebar button by its aria-label. */
export async function clickSidebar(page: Page, name: string) {
  await page.locator("aside").getByRole("button", {name}).click();
}