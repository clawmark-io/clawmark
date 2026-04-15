import { test, expect } from "@playwright/test";
import { waitForApp } from "../../utils/wait-for-app";

test.describe("Rich text editor — Ctrl+A / Cmd+A select all", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    await page.evaluate(() => (window as any).debug.createTestWorkspace());
    await page.waitForLoadState("networkidle");
    await waitForApp(page);

    // Navigate into the Kanban project
    await page.getByText("Test Workspace").first().click();
    await page.waitForURL(/#\/w\/[^/]+\/projects/);
    await page.locator(".project-card").first().click();
    await page.waitForURL(/kanban/);

    // Open the first task detail dialog
    const taskCard = page.locator("main .cursor-pointer").first();
    await taskCard.waitFor({ state: "visible", timeout: 10_000 });
    await taskCard.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Ctrl+A selects all text in the WYSIWYG editor", async ({ page }) => {
    // Open the description editor
    await page.getByRole("button", { name: /add a description/i }).click();

    // Switch to WYSIWYG mode if in markdown mode
    const switchBtn = page.getByRole("button", { name: /switch to rich text/i });
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
    }

    // Type text in the WYSIWYG editor
    const editor = page.locator(".rich-text-wysiwyg-content");
    await editor.click();
    await page.keyboard.type("Hello World");

    // Press Ctrl+A to select all
    await page.keyboard.press("Control+a");

    // Verify the editor is still open (not closed by blur)
    await expect(editor).toBeVisible();

    // Verify all text is selected
    const selectedText = await page.evaluate(() => {
      const selection = window.getSelection();
      return selection ? selection.toString().trim() : "";
    });
    expect(selectedText).toBe("Hello World");
  });

  test("Ctrl+A selects all in WYSIWYG editor with multiple paragraphs", async ({ page }) => {
    // Open the description editor
    await page.getByRole("button", { name: /add a description/i }).click();

    // Switch to WYSIWYG mode if in markdown mode
    const switchBtn = page.getByRole("button", { name: /switch to rich text/i });
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
    }

    // Type multi-paragraph content
    const editor = page.locator(".rich-text-wysiwyg-content");
    await editor.click();
    await page.keyboard.type("First paragraph");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second paragraph");

    // Press Ctrl+A to select all
    await page.keyboard.press("Control+a");

    // Verify the editor is still open
    await expect(editor).toBeVisible();

    // Verify all text is selected (both paragraphs)
    const selectedText = await page.evaluate(() => {
      const selection = window.getSelection();
      return selection ? selection.toString().trim() : "";
    });
    expect(selectedText).toContain("First paragraph");
    expect(selectedText).toContain("Second paragraph");
  });

  test("Ctrl+A in WYSIWYG editor does not close the editor", async ({ page }) => {
    // Open the description editor
    await page.getByRole("button", { name: /add a description/i }).click();

    // Switch to WYSIWYG mode if in markdown mode
    const switchBtn = page.getByRole("button", { name: /switch to rich text/i });
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
    }

    // Type text in the WYSIWYG editor
    const editor = page.locator(".rich-text-wysiwyg-content");
    await editor.click();
    await page.keyboard.type("Test content");

    // Press Ctrl+A
    await page.keyboard.press("Control+a");

    // The editor container should still be visible (not closed by blur handler)
    await expect(page.locator(".rich-text-editor-container")).toBeVisible();

    // The toolbar should still be visible
    await expect(page.locator(".rich-text-editor-toolbar")).toBeVisible();
  });
});
