import { Home, CalendarClock, RefreshCw, HelpCircle, Settings } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarIconButton } from "./sidebar-icon-button";
import { SidebarContextButtons } from "./sidebar-context-buttons";
import { useWorkspace } from "@/stores/workspace-context";
import { useOptionalWorkspaceClient } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import { useSidebarState } from "@/stores/sidebar";
import { cloudSyncRefreshError } from "@/stores/cloud-sync-error-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClawmarkIcon } from "@/components/ui/clawmark-icon";
import { CLOUD_SYNC_SERVER_ID } from "@/lib/cloud-sync/cloud-sync-connection";
import { isWeb } from "@/lib/runtime";
import type { ReadableStore } from "@/lib/store";
import type { SyncServerState } from "@/types/sync";
import type { WorkspaceLocalSettings } from "@/lib/workspace/drivers/types";

type SidebarProps = {
  onAddProject: () => void;
  onHelp: () => void;
};

const defaultLocalSettings: WorkspaceLocalSettings = {
  servers: [],
  cloudSyncEnabled: false,
};

const defaultConnectionStatus: Record<string, SyncServerState> = {};

function useOptionalStore<T>(store: ReadableStore<T> | null, fallback: T): T {
  return useSyncExternalStore(
    store?.subscribe ?? (() => () => {}),
    store?.get ?? (() => fallback),
    store?.get ?? (() => fallback),
  );
}

function isLiveConnection(state: SyncServerState | undefined): boolean {
  return state?.status === "connected" || state?.status === "syncing";
}

export function Sidebar({ onAddProject, onHelp }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const client = useOptionalWorkspaceClient();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const close = useSidebarState((s) => s.close);
  const refreshError = useStore(cloudSyncRefreshError);
  const settings = useOptionalStore(client?.settings ?? null, defaultLocalSettings);
  const connectionStatus = useOptionalStore(client?.connectionStatus ?? null, defaultConnectionStatus);

  const isHome = currentPath === `/w/${workspaceId}/projects` || currentPath === `/w/${workspaceId}/projects/`;
  const isUpcoming = currentPath.includes("/upcoming");
  const isSync = currentPath.includes("/sync") && !currentPath.includes("/p/");
  const isSettings = currentPath.includes("/settings") && !currentPath.includes("/p/");
  const hasCloudSyncProblem = settings.cloudSyncEnabled && (!!refreshError || !isLiveConnection(connectionStatus[CLOUD_SYNC_SERVER_ID]));
  const hasLocalSyncProblem = settings.servers.some((server) => (
    server.syncMode === "automatic" && !isLiveConnection(connectionStatus[server.id])
  ));
  const hasSyncConfigured = settings.cloudSyncEnabled || settings.servers.length > 0;
  const hasNoSyncConfigured = !hasSyncConfigured;
  const hasWebDataLossRisk = hasNoSyncConfigured && isWeb();
  const hasSyncConnectionProblem = hasCloudSyncProblem || hasLocalSyncProblem;
  const hasSyncWarning = hasNoSyncConfigured || hasSyncConnectionProblem;
  const syncWarningTooltip = hasWebDataLossRisk
    ? t("syncWebDataLossRisk")
    : hasNoSyncConfigured
      ? t("syncNotSafelySynced")
      : t("syncConnectionProblem");

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
        <SidebarIconButton icon={RefreshCw} label={t("sync")} active={isSync} warning={hasSyncWarning} warningTone={hasWebDataLossRisk ? "error" : "warning"} warningTooltip={syncWarningTooltip} onClick={handleNav(() => navigate({ to: '/w/$workspaceId/sync', params: { workspaceId: workspaceId! } }))} />
        <SidebarIconButton icon={HelpCircle} label={t("help")} onClick={() => { onHelp(); close(); }} />
        <SidebarIconButton icon={Settings} label={t("settings")} active={isSettings} onClick={handleNav(() => navigate({ to: '/w/$workspaceId/settings', params: { workspaceId: workspaceId! } }))} />
      </div>
    </aside>
  );
}
