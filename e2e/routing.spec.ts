import {expect, test} from "@playwright/test";
import {waitForApp} from "./utils/wait-for-app";
import {expectHashPath} from "./utils/expect-hash-path";
import {clickSidebar} from "./utils/click-sidebar";

/**
 * Routing E2E test — navigates through every route in the application.
 *
 * When adding a new route, add a corresponding navigation step here.
 * See docs/Routing.md for the full route map.
 */

test("routing — navigate through every route", async ({ page }) => {
  test.setTimeout(60_000);

  // ── Setup: create test workspace ──────────────────────────────────────

  await page.goto("/");
  await waitForApp(page);

  await page.evaluate(() => (window as any).debug.createTestWorkspace());
  await page.waitForLoadState("networkidle");
  await waitForApp(page);

  // Extract workspace ID
  let workspaceId: string;
  const wsMatch = page.url().match(/#\/w\/([^/]+)/);
  if (wsMatch) {
    workspaceId = wsMatch[1];
  } else {
    await page.goto("/#/w");
    await waitForApp(page);
    await page.getByText("Test Workspace").first().click();
    await page.waitForURL(/#\/w\/[^/]+/);
    workspaceId = page.url().match(/#\/w\/([^/]+)/)![1];
  }

  // Get project IDs by clicking project cards
  await page.goto(`/#/w/${workspaceId}/projects`);
  await waitForApp(page);
  await expect(page.locator(".project-card").first()).toBeVisible();

  await page.locator(".project-card").first().click();
  await page.waitForURL(/\/p\/[^/]+/);
  const kanbanProjectId = page.url().match(/\/p\/([^/]+)/)![1];

  await page.goto(`/#/w/${workspaceId}/projects`);
  await waitForApp(page);
  await page.locator(".project-card").nth(1).click();
  await page.waitForURL(/\/p\/[^/]+/);

  // ── Route: / → redirects to /w ────────────────────────────────────────

  await page.goto("/");
  await waitForApp(page);
  await expectHashPath(page, /#\/w/);

  // ── Route: /w — workspace picker ──────────────────────────────────────

  await page.goto("/#/w");
  await waitForApp(page);
  await expect(page.getByText("Test Workspace")).toBeVisible();

  // ── Route: /w/:id — default view redirect ──────────────────────────────

  await page.goto(`/#/w/${workspaceId}`);
  await waitForApp(page);
  await expectHashPath(page, /projects/);

  // Change default view to "upcoming" and verify redirect
  await page.evaluate(
    ([id]) => (window as any).debug.setWorkspaceDefaultView(id, "upcoming"),
    [workspaceId],
  );
  await page.goto(`/#/w/${workspaceId}`);
  await waitForApp(page);
  await expectHashPath(page, /upcoming/);

  // Reset default view back to "projects" for the rest of the test
  await page.evaluate(
    ([id]) => (window as any).debug.setWorkspaceDefaultView(id, "projects"),
    [workspaceId],
  );

  // ── Route: /w/:id/projects — project grid ─────────────────────────────

  await page.goto(`/#/w/${workspaceId}/projects`);
  await waitForApp(page);
  await expect(page.locator(".project-card").first()).toBeVisible();

  // ── Route: /w/:id/upcoming ────────────────────────────────────────────

  await page.goto(`/#/w/${workspaceId}/upcoming`);
  await waitForApp(page);
  await expectHashPath(page, /upcoming/);

  // ── Route: /w/:id/settings (all tabs) ─────────────────────────────────

  await page.goto(`/#/w/${workspaceId}/settings`);
  await waitForApp(page);
  await expectHashPath(page, /settings/);
  await expect(page.getByText("General")).toBeVisible();
  await page.getByText("Look & Feel").click();
  await page.getByText("Cloud Sync").click();

  // ── Route: /w/:id/sync ────────────────────────────────────────────────

  await page.goto(`/#/w/${workspaceId}/sync`);
  await waitForApp(page);
  await expectHashPath(page, /sync/);

  // ── Route: /w/:id/p/:pid → redirect to kanban ─────────────────────────

  await page.goto(`/#/w/${workspaceId}/p/${kanbanProjectId}`);
  await waitForApp(page);
  await expectHashPath(page, /kanban/);

  // ── Route: /w/:id/p/:pid/kanban ───────────────────────────────────────

  await page.goto(`/#/w/${workspaceId}/p/${kanbanProjectId}/kanban`);
  await waitForApp(page);
  await expectHashPath(page, /kanban/);

  // ── Route: /w/:id/p/:pid/kanban/:taskId ───────────────────────────────

  // Click the first task card in the kanban board (inside main content area)
  const kanbanCard = page.locator("main .cursor-pointer").first();
  await kanbanCard.waitFor({ state: "visible", timeout: 10_000 });
  await kanbanCard.click();
  await expectHashPath(page, /kanban\/[^/]+$/);
  await expect(page.getByRole("dialog")).toBeVisible();

  // Close task detail dialog
  await page.keyboard.press("Escape");
  await expectHashPath(page, /kanban\/?$/);

  // ── Route: /w/:id/p/:pid/tasks ────────────────────────────────────────

  await page.goto(`/#/w/${workspaceId}/p/${kanbanProjectId}/tasks`);
  await waitForApp(page);
  await expectHashPath(page, /tasks/);

  // ── Route: /w/:id/p/:pid/tasks/:taskId ────────────────────────────────

  const taskRow = page.locator("main .cursor-pointer").first();
  await taskRow.waitFor({ state: "visible", timeout: 10_000 });
  await taskRow.click();
  await expectHashPath(page, /tasks\/[^/]+$/);
  await expect(page.getByRole("dialog")).toBeVisible();

  // Close task detail
  await page.keyboard.press("Escape");
  await expectHashPath(page, /tasks\/?$/);

  // ── Route: /w/:id/p/:pid/settings — project settings ─────────────────

  await page.goto(`/#/w/${workspaceId}/p/${kanbanProjectId}/settings`);
  await waitForApp(page);
  await expectHashPath(page, /\/p\/[^/]+\/settings/);

  // ── Route: /w/:id/p/:pid/workspace-settings ───────────────────────────

  await page.goto(
    `/#/w/${workspaceId}/p/${kanbanProjectId}/workspace-settings`,
  );
  await waitForApp(page);
  await expectHashPath(page, /workspace-settings/);

  // ── Route: /w/:id/p/:pid/sync ─────────────────────────────────────────

  await page.goto(`/#/w/${workspaceId}/p/${kanbanProjectId}/sync`);
  await waitForApp(page);
  await expectHashPath(page, /\/p\/[^/]+\/sync/);

  // ── Full click-through via sidebar ────────────────────────────────────

  // Start from workspace picker
  await page.goto("/#/w");
  await waitForApp(page);

  // Click Test Workspace — redirects to default view (projects)
  await page.getByText("Test Workspace").first().click();
  await page.waitForURL(/\/projects/);

  // Home → Upcoming (sidebar)
  await clickSidebar(page, "Upcoming");
  await expectHashPath(page, /upcoming/);

  // Upcoming → Settings (sidebar)
  await clickSidebar(page, "Settings");
  await expectHashPath(page, /settings/);

  // Settings → Sync (sidebar)
  await clickSidebar(page, "Sync");
  await expectHashPath(page, /sync/);

  // Sync → Home (sidebar)
  await clickSidebar(page, "Home");
  await page.waitForURL(new RegExp(`#/w/${workspaceId}/projects`));

  // Home → Click first project → Kanban
  await page.locator(".project-card").first().click();
  await page.waitForURL(/kanban/);

  // Kanban → Tasks (sidebar)
  await clickSidebar(page, "Tasks");
  await expectHashPath(page, /tasks/);

  // Tasks → Project Settings (sidebar)
  await clickSidebar(page, "Project Settings");
  await expectHashPath(page, /\/p\/[^/]+\/settings/);

  // Project Settings → Kanban (sidebar)
  await clickSidebar(page, "Kanban");
  await expectHashPath(page, /kanban/);

  // Kanban → Home (sidebar)
  await clickSidebar(page, "Home");
  await page.waitForURL(new RegExp(`#/w/${workspaceId}/projects`));

  // Home → Workspaces (sidebar)
  await page.locator("aside").getByRole("button", { name: "Workspaces" }).click();
  await page.waitForURL(/#\/w\/?$/);
});
