import type { SyncServerConfig } from "@/types/sync";
import type { CloudSyncAuth } from "./cloud-sync-auth";
import { warnCloudSync } from "./cloud-sync-log";

export const CLOUD_SYNC_SERVER_ID = "cloud-sync";

export function buildCloudSyncConfig(auth: CloudSyncAuth): SyncServerConfig | null {
  if (!auth.accessToken) return null;
  if (!auth.cloudSyncUrl) {
    warnCloudSync("cloud sync URL missing; sign in again to refresh auth data");
    return null;
  }

  let url: URL;
  try {
    url = new URL(auth.cloudSyncUrl.trim());
  } catch {
    warnCloudSync("cloud sync URL is invalid; sign in again to refresh auth data");
    return null;
  }

  return {
    id: CLOUD_SYNC_SERVER_ID,
    name: "Cloud Sync",
    host: url.hostname,
    port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
    useTls: url.protocol === "https:",
    accessToken: auth.accessToken,
    syncMode: "automatic",
  };
}
