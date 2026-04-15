import { Home, CalendarClock, RefreshCw, HelpCircle, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarIconButton } from "./sidebar-icon-button";
import { SidebarContextButtons } from "./sidebar-context-buttons";
import { useWorkspace } from "@/stores/workspace-context";
import { useStore } from "@/hooks/use-store";
import { useSidebarState } from "@/stores/sidebar";
import { cloudSyncRefreshError } from "@/stores/cloud-sync-error-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClawmarkIcon } from "@/components/ui/clawmark-icon";

type SidebarProps = {
  onAddProject: () => void;
  onHelp: () => void;
};

export function Sidebar({ onAddProject, onHelp }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const close = useSidebarState((s) => s.close);
  const refreshError = useStore(cloudSyncRefreshError);

  const isHome = currentPath === `/w/${workspaceId}/projects` || currentPath === `/w/${workspaceId}/projects/`;
  const isUpcoming = currentPath.includes("/upcoming");
  const isSync = currentPath.includes("/sync") && !currentPath.includes("/p/");
  const isSettings = currentPath.includes("/settings") && !currentPath.includes("/p/");

  const handleNav = (fn: () => void) => () => {
    fn();
    close();
  };

  return (
    <aside className="sidebar-panel w-14 flex flex-col justify-between bg-base-200 border-r border-[var(--border-subtle)] py-3 shrink-0">
      <div className="flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleNav(() => navigate({ to: '/w' }))}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0f172a] mb-1 cursor-pointer hover:opacity-80 transition-opacity border-0"
              aria-label={t("workspaces")}
            >
              <ClawmarkIcon size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t("workspaces")}</TooltipContent>
        </Tooltip>
        <SidebarIconButton icon={Home} label={t("home")} active={isHome} onClick={handleNav(() => navigate({ to: '/w/$workspaceId/projects', params: { workspaceId: workspaceId! } }))} />
        <SidebarIconButton icon={CalendarClock} label={t("upcoming")} active={isUpcoming} onClick={handleNav(() => navigate({ to: '/w/$workspaceId/upcoming', params: { workspaceId: workspaceId! } }))} />
        <div className="w-6 h-px bg-[var(--border-default)] my-1.5" />
        <nav className="flex flex-col items-center gap-1">
          <SidebarContextButtons onAddProject={() => { onAddProject(); close(); }} />
        </nav>
      </div>

      <div className="flex flex-col items-center gap-1">
        <SidebarIconButton icon={RefreshCw} label={t("sync")} active={isSync} warning={!!refreshError} onClick={handleNav(() => navigate({ to: '/w/$workspaceId/sync', params: { workspaceId: workspaceId! } }))} />
        <SidebarIconButton icon={HelpCircle} label={t("help")} onClick={() => { onHelp(); close(); }} />
        <SidebarIconButton icon={Settings} label={t("settings")} active={isSettings} onClick={handleNav(() => navigate({ to: '/w/$workspaceId/settings', params: { workspaceId: workspaceId! } }))} />
      </div>
    </aside>
  );
}
