import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SectionHeader } from "@/components/ui/section-header";
import { useWorkspace } from "@/stores/workspace-context";
import { useWorkspaceClient } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import { cloudSyncRefreshError } from "@/stores/cloud-sync-error-store";
import { isCloudSyncSignedIn } from "@/lib/cloud-sync/cloud-sync-auth";
import { CLOUD_SYNC_SERVER_ID } from "@/lib/cloud-sync/cloud-sync-connection";
import { StatusIndicator } from "./status-indicator";

type CloudSyncBadgeState = "local" | "cloud-sync" | "warning";

function CloudSyncBadge({ state }: { state: CloudSyncBadgeState }) {
  const { t } = useTranslation("settings");

  const config: Record<CloudSyncBadgeState, { label: string; className: string }> = {
    local: { label: t("cloudSyncLocal"), className: "badge-neutral" },
    "cloud-sync": { label: t("cloudSyncEnabled"), className: "badge-success" },
    warning: { label: t("cloudSyncWarning"), className: "badge-warning" },
  };

  const { label, className } = config[state];

  return <span className={`badge badge-sm ${className}`}>{label}</span>;
}

export function CloudSyncSection() {
  const { t } = useTranslation("sync");
  const { t: ts } = useTranslation("settings");
  const client = useWorkspaceClient();
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const settings = useStore(client.settings);
  const refreshError = useStore(cloudSyncRefreshError);

  const signedIn = isCloudSyncSignedIn();
  const cloudSyncOn = settings.cloudSyncEnabled;

  return (
    <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-[var(--border-subtle)]">
      <SectionHeader>{t("cloudSyncSection")}</SectionHeader>

      {refreshError ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <p className="text-sm text-warning">{ts("deviceAuthRefreshError", { error: refreshError })}</p>
        </div>
      ) : null}

      {!signedIn && !cloudSyncOn ? (
        <NotConfiguredState onConfigure={() => navigate({ to: '/w/$workspaceId/settings', params: { workspaceId: workspaceId! }, search: { tab: 'cloud-sync' } })} />
      ) : signedIn && !cloudSyncOn ? (
        <DisabledState onEnable={() => client.setCloudSyncEnabled(true)} />
      ) : signedIn && cloudSyncOn ? (
        <EnabledState onDisable={() => client.setCloudSyncEnabled(false)} />
      ) : (
        <SignedOutWarningState
          onSignIn={() => navigate({ to: '/w/$workspaceId/settings', params: { workspaceId: workspaceId! }, search: { tab: 'cloud-sync' } })}
          onDisable={() => client.setCloudSyncEnabled(false)}
        />
      )}
    </div>
  );
}

function NotConfiguredState({ onConfigure }: { onConfigure: () => void }) {
  const { t } = useTranslation("sync");

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-[var(--text-muted)]">{t("cloudSyncNotConfigured")}</p>
      <button className="btn btn-outline btn-sm shrink-0" onClick={onConfigure}>
        {t("configureCloudSync")}
      </button>
    </div>
  );
}

function DisabledState({ onEnable }: { onEnable: () => void }) {
  const { t } = useTranslation("sync");
  const { t: ts } = useTranslation("settings");

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <CloudSyncBadge state="local" />
        <p className="text-sm text-[var(--text-muted)]">{t("cloudSyncDisabledForWorkspace")}</p>
      </div>
      <button className="btn btn-primary btn-sm shrink-0" onClick={onEnable}>
        {ts("syncToCloud")}
      </button>
    </div>
  );
}

function EnabledState({ onDisable }: { onDisable: () => void }) {
  const { t } = useTranslation("sync");
  const { t: ts } = useTranslation("settings");
  const client = useWorkspaceClient();
  const connectionStatus = useStore(client.connectionStatus);
  const cloudSyncState = connectionStatus[CLOUD_SYNC_SERVER_ID];
  const status = cloudSyncState?.status ?? "disconnected";

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CloudSyncBadge state="cloud-sync" />
          <p className="text-sm text-[var(--text-muted)]">{t("cloudSyncEnabledForWorkspace")}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} />
          {cloudSyncState?.error ? (
            <span className="text-xs text-error truncate">{cloudSyncState.error}</span>
          ) : null}
        </div>
      </div>
      <button className="btn btn-outline btn-sm shrink-0" onClick={onDisable}>
        {ts("stopSyncing")}
      </button>
    </div>
  );
}

function SignedOutWarningState({ onSignIn, onDisable }: { onSignIn: () => void; onDisable: () => void }) {
  const { t } = useTranslation("sync");
  const { t: ts } = useTranslation("settings");

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <CloudSyncBadge state="warning" />
        <p className="text-sm text-[var(--text-muted)]">{t("cloudSyncSignedOutWarning")}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button className="btn btn-primary btn-sm" onClick={onSignIn}>
          {t("signIn")}
        </button>
        <button className="btn btn-outline btn-sm" onClick={onDisable}>
          {ts("disableSync")}
        </button>
      </div>
    </div>
  );
}
