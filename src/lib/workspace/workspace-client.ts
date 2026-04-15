import type { Repo, DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model.ts";
import type { SyncServerConfig, SyncConnectionStatus, SyncServerState } from "@/types/sync.ts";
import type { FilesystemDriver, PersistenceDriver, WorkspaceLocalSettings } from "@/lib/workspace/drivers/types.ts";
import { createStore, readOnly } from "@/lib/store.ts";
import type { ReadableStore, WritableStore } from "@/lib/store.ts";
import { ImageStore } from "@/lib/image-store.ts";
import { BackgroundProcesses } from "@/lib/workspace/background-processes.ts";
import { SyncManager } from "@/lib/sync/sync-manager.ts";

export type WorkspaceClientOptions = {
  workspaceId: string;
  repo: Repo;
  handle: DocHandle<Workspace>;
  fs: FilesystemDriver;
  persistence: PersistenceDriver;
  loadServices: boolean;
};

export class WorkspaceClient {
  readonly workspaceId: string;
  readonly doc: ReadableStore<Workspace | null>;
  readonly settings: ReadableStore<WorkspaceLocalSettings>;
  readonly connectionStatus: ReadableStore<Record<string, SyncServerState>>;
  readonly images: ImageStore;

  private readonly repo: Repo;
  private readonly handle: DocHandle<Workspace>;
  private readonly persistence: PersistenceDriver;
  private readonly docStore: WritableStore<Workspace | null>;
  private readonly settingsStore: WritableStore<WorkspaceLocalSettings>;
  private readonly connectionStatusStore: WritableStore<Record<string, SyncServerState>>;
  private syncManager: SyncManager | null = null;
  private backgroundProcesses: BackgroundProcesses | null = null;
  private docChangeHandler: (() => void) | null = null;

  constructor(options: WorkspaceClientOptions) {
    this.workspaceId = options.workspaceId;
    this.repo = options.repo;
    this.handle = options.handle;
    this.persistence = options.persistence;

    // Initialize doc store from current handle state
    const initialDoc = options.handle.isReady() ? (options.handle.doc() as Workspace | null) : null;
    this.docStore = createStore<Workspace | null>(initialDoc);
    this.doc = readOnly(this.docStore);

    // Subscribe to Automerge doc changes
    this.docChangeHandler = () => {
      this.docStore.set(this.handle.isReady() ? (this.handle.doc() as Workspace | null) : null);
    };
    this.handle.on("change", this.docChangeHandler);

    // Initialize settings from persistence
    const initialSettings = options.persistence.loadLocalSettings(options.workspaceId);
    this.settingsStore = createStore<WorkspaceLocalSettings>(initialSettings);
    this.settings = readOnly(this.settingsStore);

    // Initialize connection status
    this.connectionStatusStore = createStore<Record<string, SyncServerState>>({});
    this.connectionStatus = readOnly(this.connectionStatusStore);

    // Create ImageStore
    this.images = new ImageStore(
      options.workspaceId,
      options.fs,
      () => this.settingsStore.get().servers,
    );

    // Create SyncManager if services are requested
    if (options.loadServices) {
      this.syncManager = new SyncManager(
        (serverId, status, error) => this.onStatusChange(serverId, status, error),
        (serverId, timestamp) => this.onLastSynced(serverId, timestamp),
      );
      this.syncManager.setRepo(this.repo, this.workspaceId, this.handle);
    }
  }

  getHandle(): DocHandle<Workspace> {
    return this.handle;
  }

  getRepo(): Repo {
    return this.repo;
  }

  // --- Sync operations ---

  connectServer(config: SyncServerConfig): void {
    this.syncManager?.connect(config);
  }

  disconnectServer(id: string): void {
    this.syncManager?.disconnect(id);
  }

  syncNow(config: SyncServerConfig): void {
    this.syncManager?.syncNow(config);
  }

  connectCloudSync(): void {
    this.syncManager?.connectCloudSync();
  }

  disconnectCloudSync(): void {
    this.syncManager?.disconnectCloudSync();
  }

  connectAutomaticServers(): void {
    if (!this.syncManager) return;
    const servers = this.settingsStore.get().servers;
    for (const server of servers) {
      if (server.syncMode === "automatic") {
        this.syncManager.connect(server);
      }
    }
  }

  async flushConnectedServers(): Promise<void> {
    if (!this.syncManager) return;
    const servers = this.settingsStore.get().servers;
    await this.syncManager.flushConnectedServers(servers);
  }

  // --- Settings mutations ---

  addServer(config: SyncServerConfig): void {
    this.settingsStore.update((s) => ({
      ...s,
      servers: [...s.servers, config],
    }));
    this.persistSettings();
  }

  updateServer(id: string, patch: Partial<SyncServerConfig>): void {
    this.settingsStore.update((s) => ({
      ...s,
      servers: s.servers.map((srv) => (srv.id === id ? { ...srv, ...patch } : srv)),
    }));
    this.persistSettings();
  }

  removeServer(id: string): void {
    this.syncManager?.disconnect(id);
    this.settingsStore.update((s) => ({
      ...s,
      servers: s.servers.filter((srv) => srv.id !== id),
    }));
    this.persistSettings();
  }

  setCloudSyncEnabled(enabled: boolean): void {
    this.settingsStore.update((s) => ({
      ...s,
      cloudSyncEnabled: enabled,
    }));
    this.persistSettings();
  }

  // --- Background processes ---

  startBackgroundProcesses(intervalMs: number = 15 * 60_000): void {
    if (!this.backgroundProcesses) {
      this.backgroundProcesses = new BackgroundProcesses();
    }
    this.backgroundProcesses.start(this.handle, intervalMs);
  }

  stopBackgroundProcesses(): void {
    this.backgroundProcesses?.stop();
  }

  // --- Lifecycle ---

  close(): void {
    this.stopBackgroundProcesses();
    this.syncManager?.teardown();
    this.syncManager = null;

    if (this.docChangeHandler) {
      this.handle.off("change", this.docChangeHandler);
      this.docChangeHandler = null;
    }
  }

  // --- Private helpers ---

  private persistSettings(): void {
    this.persistence.saveLocalSettings(this.workspaceId, this.settingsStore.get());
  }

  private onStatusChange(serverId: string, status: SyncConnectionStatus, error?: string): void {
    this.connectionStatusStore.update((states) => ({
      ...states,
      [serverId]: {
        ...(states[serverId] ?? { id: serverId, lastSyncedAt: null, error: null }),
        id: serverId,
        status,
        error: error ?? null,
      },
    }));
  }

  private onLastSynced(serverId: string, timestamp: number): void {
    this.connectionStatusStore.update((states) => ({
      ...states,
      [serverId]: {
        ...(states[serverId] ?? { id: serverId, status: "disconnected" as const, error: null }),
        lastSyncedAt: timestamp,
      },
    }));
  }
}
