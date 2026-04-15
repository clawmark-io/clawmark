import { generateId } from "@/lib/utils/id";
import type { AutomergeUrl, StorageAdapter } from "@automerge/automerge-repo";
import type { ThemeSettings, Workspace } from "@/types/data-model.ts";
import type { FilesystemDriver, PersistenceDriver, WorkspaceListEntry, WorkspaceLocalSettings, LastUsedTheme } from "@/lib/workspace/drivers/types.ts";
import { createStore, readOnly } from "@/lib/store.ts";
import type { ReadableStore } from "@/lib/store.ts";
import { WorkspaceClient } from "@/lib/workspace/workspace-client.ts";
import { createWorkspaceRepo, createWorkspaceDoc, claimRepo } from "@/lib/automerge/repo.ts";

export type WorkspacesManagerConfig = {
  fs: FilesystemDriver;
  createStorageAdapter: (databaseName: string) => StorageAdapter;
  persistence: PersistenceDriver;
};

type ClientEntry = {
  client: WorkspaceClient;
  refCount: number;
  loadServices: boolean;
};

export class WorkspacesManager {
  readonly workspaces: ReadableStore<WorkspaceListEntry[]>;
  readonly activeWorkspaceId: ReadableStore<string | null>;
  readonly lastUsedTheme: ReadableStore<LastUsedTheme>;
  private readonly workspacesStore;
  private readonly activeWorkspaceIdStore;
  private readonly lastUsedThemeStore;
  private readonly config: WorkspacesManagerConfig;
  private readonly clients = new Map<string, ClientEntry>();

  constructor(config: WorkspacesManagerConfig) {
    this.config = config;

    const initial = config.persistence.loadWorkspaceList();
    this.workspacesStore = createStore<WorkspaceListEntry[]>(initial);
    this.workspaces = readOnly(this.workspacesStore);

    this.activeWorkspaceIdStore = createStore<string | null>(config.persistence.loadActiveWorkspaceId());
    this.activeWorkspaceId = readOnly(this.activeWorkspaceIdStore);

    this.lastUsedThemeStore = createStore<LastUsedTheme>(config.persistence.loadLastUsedTheme());
    this.lastUsedTheme = readOnly(this.lastUsedThemeStore);
  }

  // --- Workspace list operations ---

  createWorkspace(name: string, theme?: ThemeSettings): WorkspaceListEntry {
    const workspaceId = generateId();
    const databaseName = `tasks-ws-${workspaceId}`;

    const repo = createWorkspaceRepo(databaseName);
    const { url } = createWorkspaceDoc(repo, name, theme);

    this.config.persistence.saveWorkspaceDocUrl(workspaceId, url);

    const entry: WorkspaceListEntry = {
      workspaceId,
      databaseName,
      name,
      lastAccessedAt: Date.now(),
      projectNames: [],
    };

    this.workspacesStore.update((list) => [...list, entry]);
    this.config.persistence.saveWorkspaceList(this.workspacesStore.get());

    repo.shutdown();
    return entry;
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    // Release any open client
    const clientEntry = this.clients.get(workspaceId);
    if (clientEntry) {
      clientEntry.client.close();
      this.clients.delete(workspaceId);
    }

    const entry = this.workspacesStore.get().find((e) => e.workspaceId === workspaceId);

    // Clear active workspace if it's the one being deleted
    if (this.activeWorkspaceIdStore.get() === workspaceId) {
      this.setActiveWorkspaceId(null);
    }

    // Remove from list
    this.workspacesStore.update((list) => list.filter((e) => e.workspaceId !== workspaceId));
    this.config.persistence.saveWorkspaceList(this.workspacesStore.get());

    // Delete IndexedDB database
    if (entry) {
      try {
        await new Promise<void>((resolve, reject) => {
          const req = indexedDB.deleteDatabase(entry.databaseName);
          req.onsuccess = () => resolve();
          req.addEventListener("error", () => reject(req.error));
        });
      } catch {
        // Database may not exist
      }
    }

    // Remove filesystem data
    await this.config.fs.removeDirectory(workspaceId, "");

    // Remove persistence data
    this.config.persistence.removeLocalSettings(workspaceId);
    this.config.persistence.removeWorkspaceDocUrl(workspaceId);
  }

  renameWorkspace(workspaceId: string, name: string): void {
    this.workspacesStore.update((list) =>
      list.map((e) => (e.workspaceId === workspaceId ? { ...e, name } : e)),
    );
    this.config.persistence.saveWorkspaceList(this.workspacesStore.get());
  }

  updateWorkspaceMetadata(workspaceId: string, updates: Partial<WorkspaceListEntry>): void {
    this.workspacesStore.update((list) =>
      list.map((e) => (e.workspaceId === workspaceId ? { ...e, ...updates } : e)),
    );
    this.config.persistence.saveWorkspaceList(this.workspacesStore.get());
  }

  addWorkspaceEntry(entry: WorkspaceListEntry): void {
    this.workspacesStore.update((list) => [...list, entry]);
    this.config.persistence.saveWorkspaceList(this.workspacesStore.get());
  }

  getWorkspaceMetadata(workspaceId: string): WorkspaceListEntry | undefined {
    return this.workspacesStore.get().find((e) => e.workspaceId === workspaceId);
  }

  // --- Active workspace ---

  getActiveWorkspaceId(): string | null {
    return this.activeWorkspaceIdStore.get();
  }

  setActiveWorkspaceId(id: string | null): void {
    this.activeWorkspaceIdStore.set(id);
    this.config.persistence.saveActiveWorkspaceId(id);
  }

  // --- Theme ---

  getLastUsedTheme(): LastUsedTheme {
    return this.lastUsedThemeStore.get();
  }

  setLastUsedTheme(theme: LastUsedTheme): void {
    this.lastUsedThemeStore.set(theme);
    this.config.persistence.saveLastUsedTheme(theme);
  }

  // --- Client management ---

  async getWorkspace(workspaceId: string, opts?: { loadServices?: boolean }): Promise<WorkspaceClient> {
    const loadServices = opts?.loadServices ?? false;

    // Check for existing client with matching service level
    const existing = this.clients.get(workspaceId);
    if (existing) {
      // If a full client exists and we want a full client, reuse it
      if (existing.loadServices && loadServices) {
        existing.refCount++;
        return existing.client;
      }
      // If a light client exists and we want a light client, reuse it
      if (!existing.loadServices && !loadServices) {
        existing.refCount++;
        return existing.client;
      }
      // If a full client exists and we want a light client, create a separate one
      // with its own repo (as per PRD: light client gets its own in-memory-only repo)
      // For now: create a new client. The full client stays in the registry.
    }

    const entry = this.workspacesStore.get().find((e) => e.workspaceId === workspaceId);
    if (!entry) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const storedUrl = this.config.persistence.loadWorkspaceDocUrl(workspaceId);
    if (!storedUrl) {
      throw new Error(`No stored URL for workspace ${workspaceId}`);
    }

    // Create repo — try claiming a parked one first
    const repo = claimRepo(entry.databaseName) ?? createWorkspaceRepo(entry.databaseName);

    // Find and wait for the doc handle
    const handle = await repo.find<Workspace>(storedUrl as AutomergeUrl);
    await handle.whenReady();

    const client = new WorkspaceClient({
      workspaceId,
      repo,
      handle,
      fs: this.config.fs,
      persistence: this.config.persistence,
      loadServices,
    });

    // Only register the primary client (first opened)
    if (!this.clients.has(workspaceId)) {
      this.clients.set(workspaceId, { client, refCount: 1, loadServices });
    } else if (loadServices && !this.clients.get(workspaceId)!.loadServices) {
      // Upgrade: replace light client with full client
      const old = this.clients.get(workspaceId)!;
      old.client.close();
      this.clients.set(workspaceId, { client, refCount: 1, loadServices: true });
    } else {
      // Secondary (light) client alongside existing full client — track separately
      // The caller must manage this client's lifecycle via releaseWorkspace
      return client;
    }

    return client;
  }

  releaseWorkspace(client: WorkspaceClient): void {
    const entry = this.clients.get(client.workspaceId);
    if (entry && entry.client === client) {
      entry.refCount--;
      if (entry.refCount <= 0) {
        entry.client.close();
        try {
          client.getRepo().shutdown();
        } catch {
          // Repo may already be shut down
        }
        this.clients.delete(client.workspaceId);
      }
    } else {
      // Secondary client (not in registry) — just close and shutdown
      client.close();
      try {
        client.getRepo().shutdown();
      } catch {
        // Repo may already be shut down
      }
    }
  }

  // --- Settings ---

  getWorkspaceLocalSettings(workspaceId: string): WorkspaceLocalSettings {
    // Prefer in-memory client settings if available (most up-to-date)
    const entry = this.clients.get(workspaceId);
    if (entry) return entry.client.settings.get();
    return this.config.persistence.loadLocalSettings(workspaceId);
  }

  saveWorkspaceLocalSettings(workspaceId: string, settings: WorkspaceLocalSettings): void {
    this.config.persistence.saveLocalSettings(workspaceId, settings);
  }

  setWorkspaceCloudSyncEnabled(workspaceId: string, enabled: boolean): void {
    const entry = this.clients.get(workspaceId);
    if (entry) {
      // Active client — update in-memory store + persist
      entry.client.setCloudSyncEnabled(enabled);
    } else {
      // No active client — update persistence only
      const settings = this.config.persistence.loadLocalSettings(workspaceId);
      this.config.persistence.saveLocalSettings(workspaceId, { ...settings, cloudSyncEnabled: enabled });
    }
  }

  // --- Persistence helpers ---

  saveWorkspaceDocUrl(workspaceId: string, url: string): void {
    this.config.persistence.saveWorkspaceDocUrl(workspaceId, url);
  }

  // --- Lifecycle ---

  dispose(): void {
    for (const [, entry] of this.clients) {
      entry.client.close();
      try {
        entry.client.getRepo().shutdown();
      } catch {
        // Repo may already be shut down
      }
    }
    this.clients.clear();
  }
}
