import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { isTauri } from "@tauri-apps/api/core";
import { Briefcase, AlertTriangle } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusIndicator } from "@/components/sync/status-indicator";
import { useManager, useOptionalWorkspaceClient } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import { cloudSyncRefreshError } from "@/stores/cloud-sync-error-store";
import {
  getCloudSyncAuth,
  setCloudSyncAuth,
  clearCloudSyncAuth,
  subscribeAuthChange,
  getAuthVersion,
} from "@/lib/cloud-sync/cloud-sync-auth";
import { CLOUD_SYNC_SERVER_ID } from "@/lib/cloud-sync/cloud-sync-connection";
import { requestDeviceCode, pollDeviceToken } from "@/lib/cloud-sync/device-auth-api";
import { stopTokenRefreshMonitor } from "@/lib/cloud-sync/token-refresh-monitor";
import type { WorkspaceClient } from "@/lib/workspace/workspace-client";

// --- Auth subscription hook ---

function useCloudSyncAuth() {
  useSyncExternalStore(subscribeAuthChange, getAuthVersion);
  return getCloudSyncAuth();
}

// --- Open verification URL ---

const AUTH_POPUP_NAME = "clawmark-cloud-sync-auth";

function getAuthPopupFeatures(): string {
  const width = 520;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

  return [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
  ].join(",");
}

function openPendingAuthPopup(): Window | null {
  const popup = window.open("about:blank", AUTH_POPUP_NAME, getAuthPopupFeatures());
  if (!popup) return null;

  try {
    popup.document.title = "Cloud Sync Authorization";
    popup.document.body.style.fontFamily = "system-ui, sans-serif";
    popup.document.body.style.padding = "24px";
    popup.document.body.textContent = "Preparing Cloud Sync authorization...";
  } catch {
    // The named popup may briefly be cross-origin if the browser reused an existing auth window.
  }

  popup.focus();
  return popup;
}

function closeAuthPopup(popup: Window | null): void {
  if (!popup || popup.closed) return;

  try {
    popup.close();
  } catch {
    // Closing is best-effort; browsers can refuse in some edge cases.
  }
}

async function openVerificationUrl(url: string, popup: Window | null): Promise<Window | null> {
  if (isTauri()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
    return null;
  }

  if (popup && !popup.closed) {
    popup.location.href = url;
    popup.focus();
    return popup;
  }

  return window.open(url, AUTH_POPUP_NAME, getAuthPopupFeatures());
}

// --- Device auth flow types ---

type DeviceAuthState =
  | { step: "idle" }
  | { step: "requesting-code" }
  | { step: "waiting-for-user"; deviceCode: string; userCode: string; verificationUrl: string }
  | { step: "error"; message: string }
  | { step: "expired" };

// --- Main component ---

export function CloudSyncSettings() {
  const auth = useCloudSyncAuth();

  return auth ? <SignedInState /> : <SignedOutState />;
}

// --- Signed-out state: device auth flow ---

const POLL_INTERVAL_MS = 5_000;

function SignedOutState() {
  const { t } = useTranslation("settings");
  const [state, setState] = useState<DeviceAuthState>({ step: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const authPopupRef = useRef<Window | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      closeAuthPopup(authPopupRef.current);
    };
  }, []);

  const handleStartAuth = async () => {
    abortRef.current?.abort();
    closeAuthPopup(authPopupRef.current);
    authPopupRef.current = isTauri() ? null : openPendingAuthPopup();

    const abort = new AbortController();
    abortRef.current = abort;

    setState({ step: "requesting-code" });

    try {
      const { deviceCode, userCode, verificationUrl } = await requestDeviceCode();
      if (abort.signal.aborted) return;

      setState({ step: "waiting-for-user", deviceCode, userCode, verificationUrl });
      authPopupRef.current = await openVerificationUrl(verificationUrl, authPopupRef.current);

      while (!abort.signal.aborted) {
        // eslint-disable-next-line no-await-in-loop -- sequential polling: wait then check result before next iteration
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (abort.signal.aborted) return;

        // eslint-disable-next-line no-await-in-loop -- sequential polling: must check each result before deciding to continue
        const result = await pollDeviceToken(deviceCode);
        if (abort.signal.aborted) return;

        if (result.status === "pending") continue;

        if (result.status === "expired") {
          closeAuthPopup(authPopupRef.current);
          authPopupRef.current = null;
          setState({ step: "expired" });
          return;
        }

        if (result.status === "complete") {
          closeAuthPopup(authPopupRef.current);
          authPopupRef.current = null;
          setCloudSyncAuth({
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            expiresAt: result.data.expiresAt,
            cloudSyncUrl: result.data.cloudSyncUrl,
          });
          return;
        }
      }
    } catch {
      closeAuthPopup(authPopupRef.current);
      authPopupRef.current = null;
      if (!abort.signal.aborted) {
        setState({ step: "error", message: t("deviceAuthNetworkError") });
      }
    }
  };

  const handleOpenVerification = async (verificationUrl: string) => {
    authPopupRef.current = await openVerificationUrl(
      verificationUrl,
      isTauri() ? null : openPendingAuthPopup()
    );
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    closeAuthPopup(authPopupRef.current);
    authPopupRef.current = null;
    setState({ step: "idle" });
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader>{t("cloudSync")}</SectionHeader>
      <p className="text-sm text-[var(--text-muted)]">{t("cloudSyncSignInDescription")}</p>

      {state.step === "idle" ? (
        <DeviceAuthIdleState onStart={handleStartAuth} />
      ) : state.step === "requesting-code" ? (
        <DeviceAuthLoadingState />
      ) : state.step === "waiting-for-user" ? (
        <DeviceAuthPendingState
          userCode={state.userCode}
          verificationUrl={state.verificationUrl}
          onOpenVerification={handleOpenVerification}
          onCancel={handleCancel}
        />
      ) : state.step === "error" ? (
        <DeviceAuthErrorState message={state.message} onRetry={handleStartAuth} />
      ) : state.step === "expired" ? (
        <DeviceAuthExpiredState onRetry={handleStartAuth} />
      ) : null}
    </div>
  );
}

function DeviceAuthIdleState({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation("settings");
  return (
    <button className="btn btn-primary btn-sm self-start" onClick={onStart}>
      {t("signInButton")}
    </button>
  );
}

function DeviceAuthLoadingState() {
  const { t } = useTranslation("settings");
  return <p className="text-sm text-[var(--text-muted)]">{t("deviceAuthRequesting")}</p>;
}

function DeviceAuthPendingState({
  userCode,
  verificationUrl,
  onOpenVerification,
  onCancel,
}: {
  userCode: string;
  verificationUrl: string;
  onOpenVerification: (verificationUrl: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">{t("deviceAuthOpenBrowser")}</p>
      <code className="text-lg font-mono font-bold tracking-widest px-3 py-2 rounded bg-[var(--surface-overlay)] self-start">
        {userCode}
      </code>
      <p className="text-sm text-[var(--text-muted)]">{t("deviceAuthWaiting")}</p>
      <div className="flex items-center gap-2">
        <button className="btn btn-outline btn-sm" onClick={() => onOpenVerification(verificationUrl)}>
          {t("deviceAuthOpenWindowButton")}
        </button>
        <button className="btn btn-outline btn-sm" onClick={onCancel}>
          {tc("cancelButton")}
        </button>
      </div>
    </div>
  );
}

function DeviceAuthErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-error">{message}</p>
      <button className="btn btn-outline btn-sm self-start" onClick={onRetry}>
        {t("retryButton")}
      </button>
    </div>
  );
}

function DeviceAuthExpiredState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-[var(--text-muted)]">{t("deviceAuthExpired")}</p>
      <button className="btn btn-outline btn-sm self-start" onClick={onRetry}>
        {tc("retryButton")}
      </button>
    </div>
  );
}

// --- Signed-in state: status + workspace list ---

function CloudSyncStatusIndicator() {
  const client = useOptionalWorkspaceClient();
  if (!client) return null;
  return <CloudSyncStatusFromClient />;
}

function CloudSyncStatusFromClient() {
  const client = useOptionalWorkspaceClient()!;
  const settings = useStore(client.settings);
  const connectionStatus = useStore(client.connectionStatus);
  const cloudSyncState = connectionStatus[CLOUD_SYNC_SERVER_ID];
  const status = cloudSyncState?.status ?? "disconnected";

  if (!settings.cloudSyncEnabled) {
    return <CloudSyncBadge state="local" />;
  }

  return (
    <>
      <StatusIndicator status={status} />
      {cloudSyncState?.error ? (
        <span className="text-xs text-error truncate">{cloudSyncState.error}</span>
      ) : null}
    </>
  );
}

function CurrentWorkspaceCloudSyncButton() {
  const client = useOptionalWorkspaceClient();
  if (!client) return null;

  return <CurrentWorkspaceCloudSyncButtonFromClient client={client} />;
}

function CurrentWorkspaceCloudSyncButtonFromClient({ client }: { client: WorkspaceClient }) {
  const { t } = useTranslation("settings");
  const settings = useStore(client.settings);

  if (!settings) return null;

  if (settings.cloudSyncEnabled) {
    return (
      <button className="btn btn-outline btn-sm" onClick={() => client.setCloudSyncEnabled(false)}>
        {t("stopSyncing")}
      </button>
    );
  }

  return (
    <button className="btn btn-primary btn-sm" onClick={() => client.setCloudSyncEnabled(true)}>
      {t("syncToCloud")}
    </button>
  );
}

function SignedInState() {
  const { t } = useTranslation("settings");
  const refreshError = useStore(cloudSyncRefreshError);

  const handleSignOut = () => {
    stopTokenRefreshMonitor();
    clearCloudSyncAuth();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("cloudSyncSignedIn")}</span>
          <div className="flex items-center gap-3">
            <CloudSyncStatusIndicator />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CurrentWorkspaceCloudSyncButton />
          <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
            {t("signOutButton")}
          </button>
        </div>
      </div>

      {refreshError ? <RefreshErrorBanner message={refreshError} /> : null}

      <SectionHeader>{t("cloudSyncWorkspaces")}</SectionHeader>
      <WorkspaceList />
    </div>
  );
}

function RefreshErrorBanner({ message }: { message: string }) {
  const { t } = useTranslation("settings");
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30">
      <AlertTriangle size={16} className="text-warning shrink-0" />
      <p className="text-sm text-warning">{t("deviceAuthRefreshError", { error: message })}</p>
    </div>
  );
}

// --- Workspace list ---

type CloudSyncBadgeState = "local" | "cloud" | "cloud-sync" | "warning";

function CloudSyncBadge({ state }: { state: CloudSyncBadgeState }) {
  const { t } = useTranslation("settings");

  const badgeConfig: Record<CloudSyncBadgeState, { label: string; className: string }> = {
    local: { label: t("cloudSyncLocal"), className: "badge-neutral" },
    cloud: { label: t("cloudSyncCloud"), className: "badge-info" },
    "cloud-sync": { label: t("cloudSyncEnabled"), className: "badge-success" },
    warning: { label: t("cloudSyncWarning"), className: "badge-warning" },
  };

  const { label, className } = badgeConfig[state];

  return (
    <span className={`badge badge-sm ${className}`}>{label}</span>
  );
}

function WorkspaceList() {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  const manager = useManager();
  const workspaces = useStore(manager.workspaces);
  const auth = useCloudSyncAuth();
  const isSignedIn = auth !== null;

  // Track toggle version to force re-reads from persistence for non-active workspaces
  const [, setToggleVersion] = useState(0);

  const sorted = [...workspaces].toSorted((a, b) => a.name.localeCompare(b.name));

  const handleSetCloudSync = (wsId: string, enabled: boolean) => {
    manager.setWorkspaceCloudSyncEnabled(wsId, enabled);
    setToggleVersion((v) => v + 1);
  };

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((ws) => {
        const cloudSyncOn = manager.getWorkspaceLocalSettings(ws.workspaceId).cloudSyncEnabled;

        let badgeState: CloudSyncBadgeState;
        if (cloudSyncOn && isSignedIn) {
          badgeState = "cloud-sync";
        } else if (cloudSyncOn && !isSignedIn) {
          badgeState = "warning";
        } else {
          badgeState = "local";
        }

        return (
          <WorkspaceRow
            key={ws.workspaceId}
            name={ws.name}
            projectCountLabel={tc("projectCount", { count: ws.projectNames.length })}
            badgeState={badgeState}
            isSignedIn={isSignedIn}
            cloudSyncOn={cloudSyncOn}
            onSyncToCloud={() => handleSetCloudSync(ws.workspaceId, true)}
            onStopSyncing={() => handleSetCloudSync(ws.workspaceId, false)}
            onDisableSync={() => handleSetCloudSync(ws.workspaceId, false)}
            syncToCloudLabel={t("syncToCloud")}
            stopSyncingLabel={t("stopSyncing")}
            disableSyncLabel={t("disableSync")}
          />
        );
      })}
    </div>
  );
}

type WorkspaceRowProps = {
  name: string;
  projectCountLabel: string;
  badgeState: CloudSyncBadgeState;
  isSignedIn: boolean;
  cloudSyncOn: boolean;
  onSyncToCloud: () => void;
  onStopSyncing: () => void;
  onDisableSync: () => void;
  syncToCloudLabel: string;
  stopSyncingLabel: string;
  disableSyncLabel: string;
};

function WorkspaceRow({
  name,
  projectCountLabel,
  badgeState,
  isSignedIn,
  cloudSyncOn,
  onSyncToCloud,
  onStopSyncing,
  onDisableSync,
  syncToCloudLabel,
  stopSyncingLabel,
  disableSyncLabel,
}: WorkspaceRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-subtle)]">
      <div className="shrink-0 text-[var(--text-muted)]">
        <Briefcase size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{name}</span>
          <CloudSyncBadge state={badgeState} />
        </div>
        <span className="text-xs text-[var(--text-muted)]">{projectCountLabel}</span>
      </div>
      <div className="shrink-0">
        {isSignedIn && !cloudSyncOn ? (
          <button className="btn btn-primary btn-xs" onClick={onSyncToCloud}>
            {syncToCloudLabel}
          </button>
        ) : isSignedIn && cloudSyncOn ? (
          <button className="btn btn-outline btn-xs" onClick={onStopSyncing}>
            {stopSyncingLabel}
          </button>
        ) : !isSignedIn && cloudSyncOn ? (
          <button className="btn btn-outline btn-xs" onClick={onDisableSync}>
            {disableSyncLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
