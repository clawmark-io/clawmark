import {
  getCloudSyncAuth,
  updateCloudSyncAccessToken,
  clearCloudSyncAuth,
  notifyAuthChange,
} from "./cloud-sync-auth";
import { logCloudSync, warnCloudSync } from "./cloud-sync-log";
import { refreshAccessToken, TokenRejectedError } from "./device-auth-api";

const REFRESH_BUFFER_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 30_000;
const RETRY_DELAY_MS = 60_000;

type MonitorCallbacks = {
  onRejected?: () => void;
  onError?: (message: string) => void;
  onSuccess?: () => void;
};

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let callbacks: MonitorCallbacks = {};

export function startTokenRefreshMonitor(cbs?: MonitorCallbacks): void {
  logCloudSync("token refresh monitor started");
  callbacks = cbs ?? {};
  scheduleNextRefresh();
}

export function stopTokenRefreshMonitor(): void {
  logCloudSync("token refresh monitor stopped");
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  callbacks = {};
}

function scheduleNextRefresh(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const auth = getCloudSyncAuth();
  if (!auth?.expiresAt || !auth.refreshToken) {
    logCloudSync("token refresh not scheduled", {
      hasAuth: Boolean(auth),
      hasExpiresAt: Boolean(auth?.expiresAt),
      hasRefreshToken: Boolean(auth?.refreshToken),
    });
    return;
  }

  const now = Date.now();
  const delay = Math.max(auth.expiresAt - now - REFRESH_BUFFER_MS, MIN_REFRESH_DELAY_MS);
  logCloudSync("token refresh scheduled", {
    delayMs: delay,
    expiresInMs: auth.expiresAt - now,
  });

  refreshTimer = setTimeout(doRefresh, delay);
}

async function doRefresh(): Promise<void> {
  refreshTimer = null;
  const auth = getCloudSyncAuth();
  if (!auth?.refreshToken) return;

  try {
    logCloudSync("token refresh started");
    const result = await refreshAccessToken(auth.refreshToken);
    updateCloudSyncAccessToken(result.accessToken, result.expiresAt);
    callbacks.onSuccess?.();
    scheduleNextRefresh();
  } catch (err) {
    if (err instanceof TokenRejectedError) {
      warnCloudSync("token refresh rejected");
      clearCloudSyncAuth();
      notifyAuthChange();
      callbacks.onRejected?.();
    } else {
      const message = err instanceof Error ? err.message : "Unknown error";
      warnCloudSync("token refresh failed", { message });
      callbacks.onError?.(message);
      refreshTimer = setTimeout(doRefresh, RETRY_DELAY_MS);
    }
  }
}
