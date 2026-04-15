import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";

const APP_NAME = "Clawmark";

const PROJECT_VIEW_LABELS: Record<string, string> = {
  kanban: "Board",
  tasks: "Tasks",
  settings: "Settings",
};

export function useDocumentTitle() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { workspace } = useWorkspace();

  useEffect(() => {
    const parts: string[] = [];

    if (workspace?.name) {
      parts.push(workspace.name);
    }

    const projectMatch = pathname.match(/\/p\/([^/]+)/);
    const projectId = projectMatch ? projectMatch[1] : null;

    let view = "home";
    let projectView = "tasks";
    if (pathname.includes("/upcoming")) {
      view = "upcoming";
    } else if (pathname.includes("/settings") && !pathname.includes("/p/")) {
      view = "settings";
    } else if (pathname.includes("/sync") && !pathname.includes("/p/")) {
      view = "sync";
    } else if (projectId) {
      view = "project";
      if (pathname.includes("/kanban")) projectView = "kanban";
      else if (pathname.includes("/tasks")) projectView = "tasks";
      else if (pathname.includes("/settings")) projectView = "settings";
    }

    if (view === "project" && projectId && workspace) {
      const project = workspace.projects[projectId];
      if (project) {
        parts.push(project.title);
        const effectiveView = projectView === "kanban" && !project.kanbanEnabled ? "tasks" : projectView;
        const viewLabel = PROJECT_VIEW_LABELS[effectiveView];
        if (viewLabel) {
          parts.push(viewLabel);
        }
      }
    } else if (view === "home") {
      parts.push("Projects");
    } else if (view === "upcoming") {
      parts.push("Upcoming");
    } else if (view === "settings") {
      parts.push("Settings");
    } else if (view === "sync") {
      parts.push("Sync");
    }

    const breadcrumbs = parts.join(" / ");
    document.title = breadcrumbs ? `${breadcrumbs} — ${APP_NAME}` : APP_NAME;
  }, [pathname, workspace]);
}
