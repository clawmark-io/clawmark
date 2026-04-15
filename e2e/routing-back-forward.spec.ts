import {expect, test, Page} from "@playwright/test";
import {waitForApp} from "./utils/wait-for-app";
import {expectHashPath} from "./utils/expect-hash-path";
import {clickSidebar} from "./utils/click-sidebar";

/**
 * Routing back/forward E2E tests — verifies that browser back/forward
 * navigation works correctly for every route.
 *
 * When adding a new route, add a corresponding back/forward test here.
 * See docs/Routing.md for the full route map.
 */

/** Delay (ms) after back/forward navigation before asserting the URL. */
const NAVIGATION_SETTLE_MS = 100;

let workspaceId: string;
let projectId: string;

interface BackForwardTestOptions {
  initialUrl: string;
  matchTestUrl: RegExp;
  matchInitialUrl: RegExp;
  navigate: (ctx: {page: Page}) => Promise<void>;
}

async function runTest(page: Page, options: BackForwardTestOptions) {
  await page.goto(`/#${options.initialUrl}`);
  await waitForApp(page);

  await options.navigate({page});
  await expectHashPath(page, options.matchTestUrl);

  await page.goBack();
  await page.waitForTimeout(NAVIGATION_SETTLE_MS);
  await expectHashPath(page, options.matchInitialUrl);

  await page.goForward();
  await page.waitForTimeout(NAVIGATION_SETTLE_MS);
  await expectHashPath(page, options.matchTestUrl);
}

test.describe("routing — back/forward navigation", () => {
  test.beforeEach(async ({page}) => {
    await page.goto("/");
    await waitForApp(page);

    await page.evaluate(() => (window as any).debug.createTestWorkspace());
    await page.waitForLoadState("networkidle");
    await waitForApp(page);

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

    await page.goto(`/#/w/${workspaceId}/projects`);
    await waitForApp(page);
    await expect(page.locator(".project-card").first()).toBeVisible();

    await page.locator(".project-card").first().click();
    await page.waitForURL(/\/p\/[^/]+/);
    projectId = page.url().match(/\/p\/([^/]+)/)![1];
  });

  test("workspace picker (/w)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/projects`,
      matchTestUrl: /#\/w\/?$/,
      matchInitialUrl: new RegExp(`#/w/${workspaceId}/projects`),
      navigate: async ({page}) => {
        await page
          .locator("aside")
          .getByRole("button", {name: "Workspaces"})
          .click();
      },
    });
  });

  test("home (/w/:id → /w/:id/projects)", async ({page}) => {
    await runTest(page, {
      initialUrl: "/w",
      matchTestUrl: new RegExp(`#/w/${workspaceId}/projects`),
      matchInitialUrl: /#\/w\/?$/,
      navigate: async ({page}) => {
        await page.getByText("Test Workspace").first().click();
      },
    });
  });

  test("projects (/w/:id/projects)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/upcoming`,
      matchTestUrl: new RegExp(`#/w/${workspaceId}/projects`),
      matchInitialUrl: /upcoming/,
      navigate: async ({page}) => {
        await clickSidebar(page, "Home");
      },
    });
  });

  test("upcoming (/w/:id/upcoming)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/projects`,
      matchTestUrl: /upcoming/,
      matchInitialUrl: new RegExp(`#/w/${workspaceId}/projects`),
      navigate: async ({page}) => {
        await clickSidebar(page, "Upcoming");
      },
    });
  });

  test("settings (/w/:id/settings)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/projects`,
      matchTestUrl: /settings/,
      matchInitialUrl: new RegExp(`#/w/${workspaceId}/projects`),
      navigate: async ({page}) => {
        await clickSidebar(page, "Settings");
      },
    });
  });

  test("sync (/w/:id/sync)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/projects`,
      matchTestUrl: /sync/,
      matchInitialUrl: new RegExp(`#/w/${workspaceId}/projects`),
      navigate: async ({page}) => {
        await clickSidebar(page, "Sync");
      },
    });
  });

  test("kanban (/w/:id/p/:pid/kanban)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/projects`,
      matchTestUrl: /kanban/,
      matchInitialUrl: new RegExp(`#/w/${workspaceId}/projects`),
      navigate: async ({page}) => {
        await page.locator(".project-card").first().click();
      },
    });
  });

  test("task detail from kanban (/w/:id/p/:pid/kanban/:taskId)", async ({
    page,
  }) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/p/${projectId}/kanban`,
      matchTestUrl: /kanban\/[^/]+$/,
      matchInitialUrl: /kanban\/?$/,
      navigate: async ({page}) => {
        const kanbanCard = page.locator("main .cursor-pointer").first();
        await kanbanCard.waitFor({state: "visible", timeout: 10_000});
        await kanbanCard.click();
      },
    });
  });

  test("tasks (/w/:id/p/:pid/tasks)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/p/${projectId}/kanban`,
      matchTestUrl: /tasks/,
      matchInitialUrl: /kanban/,
      navigate: async ({page}) => {
        await clickSidebar(page, "Tasks");
      },
    });
  });

  test("task detail from tasks (/w/:id/p/:pid/tasks/:taskId)", async ({
    page,
  }) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/p/${projectId}/tasks`,
      matchTestUrl: /tasks\/[^/]+$/,
      matchInitialUrl: /tasks\/?$/,
      navigate: async ({page}) => {
        const taskRow = page.locator("main .cursor-pointer").first();
        await taskRow.waitFor({state: "visible", timeout: 10_000});
        await taskRow.click();
      },
    });
  });

  test("project settings (/w/:id/p/:pid/settings)", async ({page}) => {
    await runTest(page, {
      initialUrl: `/w/${workspaceId}/p/${projectId}/kanban`,
      matchTestUrl: /\/p\/[^/]+\/settings/,
      matchInitialUrl: /kanban/,
      navigate: async ({page}) => {
        await clickSidebar(page, "Project Settings");
      },
    });
  });
});
