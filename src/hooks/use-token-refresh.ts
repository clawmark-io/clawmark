import { useEffect } from "react";
import {
  getCloudSyncAuth,
  notifyAuthChange,
  subscribeAuthChange,
} from "@/lib/cloud-sync/cloud-sync-auth";
import {
  startTokenRefreshMonitor,
  stopTokenRefreshMonitor,
} from "@/lib/cloud-sync/token-refresh-monitor";
import { setCloudSyncRefreshError } from "@/stores/cloud-sync-error-store";

export function useTokenRefreshMonitor(): void {
  useEffect(() => {
    function syncMonitor() {
      stopTokenRefreshMonitor();

      const auth = getCloudSyncAuth();
      if (!auth?.expiresAt) return;

      startTokenRefreshMonitor({
        onRejected: () => {
          notifyAuthChange();
        },
        onError: (msg) => {
          setCloudSyncRefreshError(msg);
        },
        onSuccess: () => {
          setCloudSyncRefreshError(null);
        },
      });
    }

    syncMonitor();

    const unsubscribe = subscribeAuthChange(syncMonitor);

    return () => {
      unsubscribe();
      stopTokenRefreshMonitor();
    };
  }, []);
}
