import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import type { Repo, DocHandle } from "@automerge/automerge-repo";
import type { SyncServerConfig, SyncConnectionStatus } from "@/types/sync";
import type { Workspace } from "@/types/data-model";
import { flushImageQueue, reconcileImages, collectReferencedUuids } from "./image-sync";
import { getCloudSyncAuth } from "@/lib/cloud-sync/cloud-sync-auth";
import { CLOUD_SYNC_SERVER_ID, buildCloudSyncConfig } from "@/lib/cloud-sync/cloud-sync-connection";

const MANUAL_SYNC_QUIET_PERIOD_MS = 5000;
const IMAGE_SYNC_DELAY_MS = 3000;
const CLOUD_RECONNECT_DELAY_MS = 5000;

type StatusChangeCallback = (serverId: string, status: SyncConnectionStatus, error?: string) => void;
type LastSyncedCallback = (serverId: string, timestamp: number) => void;

export class SyncManager {
  private repo: Repo | null = null;
  private workspaceId: string | null = null;
  private docHandle: DocHandle<Workspace> | null = null;
  private adapters = new Map<string, BrowserWebSocketClientAdapter>();
  private adapterCleanups = new Map<string, () => void>();
  private manualTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private imageSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private cloudReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingCloudSync = false;
  private onStatusChange: StatusChangeCallback;
  private onLastSynced: LastSyncedCallback;

  constructor(
    onStatusChange: StatusChangeCallback,
    onLastSynced: LastSyncedCallback,
  ) {
    this.onStatusChange = onStatusChange;
    this.onLastSynced = onLastSynced;
  }

  setRepo(repo: Repo, workspaceId: string, docHandle: DocHandle<Workspace>) {
    const hadPendingCloudSync = this.pendingCloudSync;
    this.teardown();
    this.repo = repo;
    this.workspaceId = workspaceId;
    this.docHandle = docHandle;

    if (hadPendingCloudSync) {
      this.connectCloudSync();
    }
  }

  teardown() {
    for (const cleanup of this.adapterCleanups.values()) {
      cleanup();
    }
    this.adapterCleanups.clear();

    for (const [serverId, adapter] of this.adapters) {
      try {
        adapter.disconnect();
      } catch {
        // Adapter may already be disconnected
      }
      this.onStatusChange(serverId, "disconnected");
    }
    this.adapters.clear();

    for (const timer of this.manualTimers.values()) {
      clearTimeout(timer);
    }
    this.manualTimers.clear();

    for (const timer of this.imageSyncTimers.values()) {
      clearTimeout(timer);
    }
    this.imageSyncTimers.clear();

    if (this.cloudReconnectTimer) {
      clearTimeout(this.cloudReconnectTimer);
      this.cloudReconnectTimer = null;
    }

    this.pendingCloudSync = false;
    this.repo = null;
    this.workspaceId = null;
    this.docHandle = null;
  }

  connect(config: SyncServerConfig) {
    if (!this.repo || !this.workspaceId) return;
    if (this.adapters.has(config.id)) return;

    const url = this.buildUrl(config);
    this.onStatusChange(config.id, "connecting");

    try {
      const adapter = new BrowserWebSocketClientAdapter(url);
      this.repo.networkSubsystem.addNetworkAdapter(adapter);
      this.adapters.set(config.id, adapter);

      const cleanup = this.observeAdapter(config.id, adapter, () => {
        this.scheduleImageSync(config);
      });
      this.adapterCleanups.set(config.id, cleanup);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      this.onStatusChange(config.id, "error", message);
    }
  }

  disconnect(serverId: string) {
    const cleanup = this.adapterCleanups.get(serverId);
    if (cleanup) {
      cleanup();
      this.adapterCleanups.delete(serverId);
    }

    const adapter = this.adapters.get(serverId);
    if (adapter) {
      try {
        adapter.disconnect();
      } catch {
        // Already disconnected
      }
      this.adapters.delete(serverId);
    }

    const timer = this.manualTimers.get(serverId);
    if (timer) {
      clearTimeout(timer);
      this.manualTimers.delete(serverId);
    }

    const imgTimer = this.imageSyncTimers.get(serverId);
    if (imgTimer) {
      clearTimeout(imgTimer);
      this.imageSyncTimers.delete(serverId);
    }

    this.onStatusChange(serverId, "disconnected");
  }

  syncNow(config: SyncServerConfig) {
    if (!this.repo || !this.workspaceId) return;
    if (this.adapters.has(config.id)) return;

    const url = this.buildUrl(config);
    this.onStatusChange(config.id, "syncing");

    try {
      const adapter = new BrowserWebSocketClientAdapter(url);
      this.repo.networkSubsystem.addNetworkAdapter(adapter);
      this.adapters.set(config.id, adapter);

      // After CRDT quiet period: run image sync, then disconnect
      const timer = setTimeout(async () => {
        try {
          await this.runImageSync(config);
        } catch {
          // Image sync failure is non-fatal
        }
        this.disconnect(config.id);
        this.onStatusChange(config.id, "disconnected");
        this.onLastSynced(config.id, Date.now());
        this.manualTimers.delete(config.id);
      }, MANUAL_SYNC_QUIET_PERIOD_MS);

      this.manualTimers.set(config.id, timer);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      this.onStatusChange(config.id, "error", message);
    }
  }

  /**
   * Listen to adapter events to track the real WebSocket connection state.
   * Returns a cleanup function that removes the listeners.
   */
  private observeAdapter(
    serverId: string,
    adapter: BrowserWebSocketClientAdapter,
    onConnected?: () => void,
  ): () => void {
    const handlePeerCandidate = () => {
      // Only update if this adapter is still tracked (not disconnected by user)
      if (this.adapters.get(serverId) === adapter) {
        this.onStatusChange(serverId, "connected");
        onConnected?.();
      }
    };

    const handlePeerDisconnected = () => {
      if (this.adapters.get(serverId) === adapter) {
        this.onStatusChange(serverId, "connecting");
      }
    };

    adapter.on("peer-candidate", handlePeerCandidate);
    adapter.on("peer-disconnected", handlePeerDisconnected);

    return () => {
      adapter.off("peer-candidate", handlePeerCandidate);
      adapter.off("peer-disconnected", handlePeerDisconnected);
    };
  }

  connectCloudSync() {
    if (!this.repo || !this.workspaceId) {
      console.warn("[cloud-sync] connect deferred: repo not ready");
      this.pendingCloudSync = true;
      return;
    }

    if (this.adapters.has(CLOUD_SYNC_SERVER_ID)) return;

    const auth = getCloudSyncAuth();
    if (!auth) {
      console.warn("[cloud-sync] connect skipped: not authenticated");
      return;
    }

    const config = buildCloudSyncConfig(auth);
    if (!config) {
      console.warn(
        "[cloud-sync] connect skipped: missing cloudSyncUrl in auth data",
      );
      return;
    }

    // Don't create adapter with expired token — wait for token refresh
    if (auth.expiresAt && auth.expiresAt < Date.now()) {
      console.warn("[cloud-sync] connect deferred: token expired, waiting for refresh");
      this.onStatusChange(CLOUD_SYNC_SERVER_ID, "connecting");
      return;
    }

    const url = this.buildUrl(config);
    this.onStatusChange(CLOUD_SYNC_SERVER_ID, "connecting");

    try {
      const adapter = new BrowserWebSocketClientAdapter(url);
      this.repo.networkSubsystem.addNetworkAdapter(adapter);
      this.adapters.set(CLOUD_SYNC_SERVER_ID, adapter);

      const cleanup = this.observeCloudSyncAdapter(adapter, config);
      this.adapterCleanups.set(CLOUD_SYNC_SERVER_ID, cleanup);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      this.onStatusChange(CLOUD_SYNC_SERVER_ID, "error", message);
    }
  }

  disconnectCloudSync() {
    this.pendingCloudSync = false;
    if (this.cloudReconnectTimer) {
      clearTimeout(this.cloudReconnectTimer);
      this.cloudReconnectTimer = null;
    }
    this.disconnect(CLOUD_SYNC_SERVER_ID);
  }

  private observeCloudSyncAdapter(
    adapter: BrowserWebSocketClientAdapter,
    config: SyncServerConfig,
  ): () => void {
    const handlePeerCandidate = () => {
      if (this.adapters.get(CLOUD_SYNC_SERVER_ID) === adapter) {
        this.onStatusChange(CLOUD_SYNC_SERVER_ID, "connected");
        this.scheduleImageSync(config);
      }
    };

    const handlePeerDisconnected = () => {
      if (this.adapters.get(CLOUD_SYNC_SERVER_ID) === adapter) {
        // Tear down adapter with stale token URL
        this.disconnect(CLOUD_SYNC_SERVER_ID);
        // Reconnect with fresh token after delay
        this.cloudReconnectTimer = setTimeout(() => {
          this.cloudReconnectTimer = null;
          this.connectCloudSync();
        }, CLOUD_RECONNECT_DELAY_MS);
      }
    };

    adapter.on("peer-candidate", handlePeerCandidate);
    adapter.on("peer-disconnected", handlePeerDisconnected);

    return () => {
      adapter.off("peer-candidate", handlePeerCandidate);
      adapter.off("peer-disconnected", handlePeerDisconnected);
    };
  }

  connectAutomaticServers(servers: SyncServerConfig[]) {
    for (const server of servers) {
      if (server.syncMode === "automatic") {
        this.connect(server);
      }
    }
  }

  private scheduleImageSync(config: SyncServerConfig) {
    const existing = this.imageSyncTimers.get(config.id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.imageSyncTimers.delete(config.id);
      try {
        await this.runImageSync(config);
      } catch {
        // Image sync failure is non-fatal
      }
    }, IMAGE_SYNC_DELAY_MS);

    this.imageSyncTimers.set(config.id, timer);
  }

  /** Flush pending image uploads for all currently connected servers */
  async flushConnectedServers(servers?: SyncServerConfig[]) {
    if (!this.workspaceId) return;
    const wsId = this.workspaceId;
    const serverList = servers ?? [];
    await Promise.allSettled(
      serverList
        .filter((server) => this.adapters.has(server.id))
        .map((server) => flushImageQueue(wsId, server)),
    );
  }

  /** Flush pending uploads then reconcile */
  private async runImageSync(config: SyncServerConfig): Promise<void> {
    if (!this.workspaceId || !this.docHandle) return;
    const wsId = this.workspaceId;

    // Step 1: Flush pending uploads
    await flushImageQueue(wsId, config);

    // Step 2: Reconciliation — ensure server has all referenced images
    const doc = this.docHandle.doc();
    if (!doc) return;
    const referencedUuids = collectReferencedUuids(doc.projects);
    await reconcileImages(wsId, config, referencedUuids);
  }

  private buildUrl(config: SyncServerConfig): string {
    const protocol = config.useTls ? "wss" : "ws";
    return `${protocol}://${config.host}:${config.port}/v1/sync/${this.workspaceId}/data?token=${encodeURIComponent(config.accessToken)}`;
  }
}

