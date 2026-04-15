export type SyncMode = "automatic" | "manual";

export type SyncServerConfig = {
  id: string;
  name: string;
  host: string;
  port: number;
  useTls: boolean;
  accessToken: string;
  syncMode: SyncMode;
};

export type SyncConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "syncing"
  | "error";

export type SyncServerState = {
  id: string;
  status: SyncConnectionStatus;
  lastSyncedAt: number | null;
  error: string | null;
};
