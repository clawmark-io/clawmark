import type { SyncServerConfig } from "@/types/sync";
import type { CloudSyncAuth } from "./cloud-sync-auth";
import { config } from "@/lib/config";

export const CLOUD_SYNC_SERVER_ID = "cloud-sync";

export function buildCloudSyncConfig(auth: CloudSyncAuth): SyncServerConfig | null {
  if (!auth.accessToken) return null;

  // Fall back to authUrl when cloudSyncUrl is missing (e.g. older auth session
  // that was created before the server started returning cloudSyncUrl).
  const baseUrl = auth.cloudSyncUrl || config.authUrl;
  const url = new URL(baseUrl);

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
