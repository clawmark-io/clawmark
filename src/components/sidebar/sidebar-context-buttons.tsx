import {Columns3, List, Plus, Settings2} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import { SidebarIconButton } from "./sidebar-icon-button";

type SidebarContextButtonsProps = {
  onAddProject: () => void;
};

export function SidebarContextButtons({ onAddProject }: SidebarContextButtonsProps) {
  const navigate = useNavigate();
  const { workspace, workspaceId } = useWorkspace();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { t } = useTranslation();

  const projectMatch = pathname.match(/\/p\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  if (!projectId) {
    return (
      <SidebarIconButton icon={Plus} label={t("newProject", { ns: "projects" })} onClick={onAddProject} />
    );
  }

  const project = workspace?.projects[projectId];
  const kanbanEnabled = project ? project.kanbanEnabled : false;

  const isKanban = pathname.includes("/kanban");
  const isTasks = pathname.includes("/tasks");
  const isSettings = pathname.includes("/settings") && pathname.includes("/p/");

  return (
    <>
      {kanbanEnabled ? (
        <SidebarIconButton
          icon={Columns3}
          label={t("kanban")}
          active={isKanban}
          onClick={() => navigate({ to: "/w/$workspaceId/p/$projectId/kanban", params: { workspaceId, projectId } })}
        />
      ) : null}
      <SidebarIconButton
        icon={List}
        label={t("tasks")}
        active={isTasks}
        onClick={() => navigate({ to: "/w/$workspaceId/p/$projectId/tasks", params: { workspaceId, projectId } })}
      />
      <SidebarIconButton
        icon={Settings2}
        label={t("projectSettings")}
        active={isSettings}
        onClick={() => navigate({ to: "/w/$workspaceId/p/$projectId/settings", params: { workspaceId, projectId } })}
      />
    </>
  );
}
