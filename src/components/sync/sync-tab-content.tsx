import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Pencil, Trash2, Server } from "lucide-react";
import { useWorkspaceClient } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import type { SyncServerConfig, SyncServerState } from "@/types/sync";
import { StatusIndicator } from "./status-indicator";
import { AddServerDialog } from "./add-server-dialog";
import { CloudSyncSection } from "./cloud-sync-section";
import type { WorkspaceClient } from "@/lib/workspace/workspace-client.ts";

type ServerCardProps = {
  server: SyncServerConfig;
  state: SyncServerState | undefined;
  client: WorkspaceClient;
  onEdit: () => void;
  onDelete: () => void;
};

function ServerCard({ server, state, client, onEdit, onDelete }: ServerCardProps) {
  const { t } = useTranslation("sync");
  const { t: tc } = useTranslation("common");
  const status = state?.status ?? "disconnected";
  const isSyncing = status === "syncing";

  const handleSyncNow = () => {
    client.syncNow(server);
  };

  const handleToggleConnection = () => {
    if (status === "connected" || status === "connecting") {
      client.disconnectServer(server.id);
    } else {
      client.connectServer(server);
    }
  };

  const formatTimestamp = (ts: number | null): string => {
    if (!ts) return t("never");
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-[var(--border-subtle)]">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{server.name}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-base-200 text-[var(--text-muted)] shrink-0">
            {server.syncMode}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)] truncate">
          {server.host}:{server.port}
        </span>
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} />
          {state?.error ? (
            <span className="text-xs text-error truncate">{state.error}</span>
          ) : null}
          {server.syncMode === "manual" && state?.lastSyncedAt ? (
            <span className="text-xs text-[var(--text-muted)]">
              {t("lastSynced", { time: formatTimestamp(state.lastSyncedAt) })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {server.syncMode === "manual" ? (
          <button
            className="btn btn-outline btn-xs"
            onClick={handleSyncNow}
            disabled={isSyncing}
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            {t("syncNow")}
          </button>
        ) : (
          <button
            className="btn btn-outline btn-xs"
            onClick={handleToggleConnection}
          >
            {status === "connected" || status === "connecting" ? tc("disconnectButton") : tc("connectButton")}
          </button>
        )}
        <button className="btn btn-ghost btn-xs" onClick={onEdit}>
          <Pencil size={12} />
        </button>
        <button className="btn btn-ghost btn-xs text-error" onClick={onDelete}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation("sync");
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Server size={40} className="text-[var(--text-muted)]" />
      <p className="text-sm text-[var(--text-muted)]">
        {t("noSyncServers")}
      </p>
      <p className="text-xs text-[var(--text-muted)] max-w-sm text-center">
        {t("addSyncServerDescription")}
      </p>
      <button className="btn btn-primary btn-sm mt-2" onClick={onAdd}>
        {t("addSyncServer")}
      </button>
    </div>
  );
}

export function SyncTabContent() {
  const { t } = useTranslation("sync");
  const client = useWorkspaceClient();
  const settings = useStore(client.settings);
  const servers = settings.servers;
  const connectionStatus = useStore(client.connectionStatus);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<SyncServerConfig | null>(null);

  const handleDelete = (serverId: string) => {
    client.removeServer(serverId);
  };

  return (
    <>
      <CloudSyncSection />
      {servers.length === 0 ? (
        <EmptyState onAdd={() => setShowAddDialog(true)} />
      ) : (
        <div className="flex flex-col gap-2">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              state={connectionStatus[server.id]}
              client={client}
              onEdit={() => setEditingServer(server)}
              onDelete={() => handleDelete(server.id)}
            />
          ))}
          <button
            className="btn btn-outline btn-sm self-start mt-2"
            onClick={() => setShowAddDialog(true)}
          >
            {t("addSyncServer")}
          </button>
        </div>
      )}
      <AddServerDialog
        open={showAddDialog || editingServer !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingServer(null);
          }
        }}
        server={editingServer}
      />
    </>
  );
}
