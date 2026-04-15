import {
  getCloudSyncAuth,
  updateCloudSyncAccessToken,
  clearCloudSyncAuth,
  notifyAuthChange,
} from "./cloud-sync-auth";
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
  callbacks = cbs ?? {};
  scheduleNextRefresh();
}

export function stopTokenRefreshMonitor(): void {
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
  if (!auth?.expiresAt || !auth.refreshToken) return;

  const now = Date.now();
  const delay = Math.max(auth.expiresAt - now - REFRESH_BUFFER_MS, MIN_REFRESH_DELAY_MS);

  refreshTimer = setTimeout(doRefresh, delay);
}

async function doRefresh(): Promise<void> {
  refreshTimer = null;
  const auth = getCloudSyncAuth();
  if (!auth?.refreshToken) return;

  try {
    const result = await refreshAccessToken(auth.refreshToken);
    updateCloudSyncAccessToken(result.accessToken, result.expiresAt);
    callbacks.onSuccess?.();
    scheduleNextRefresh();
  } catch (err) {
    if (err instanceof TokenRejectedError) {
      clearCloudSyncAuth();
      notifyAuthChange();
      callbacks.onRejected?.();
    } else {
      const message = err instanceof Error ? err.message : "Unknown error";
      callbacks.onError?.(message);
      refreshTimer = setTimeout(doRefresh, RETRY_DELAY_MS);
    }
  }
}
