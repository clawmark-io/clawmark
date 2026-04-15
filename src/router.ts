import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { WorkspacesManager } from "@/lib/workspace/workspace-manager";

export type RouterContext = {
  manager: WorkspacesManager;
};

const hashHistory = createHashHistory();

export const createAppRouter = (manager: WorkspacesManager) =>
  createRouter({
    routeTree,
    history: hashHistory,
    context: { manager },
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
