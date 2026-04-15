import type { PersistenceDriver, WorkspaceListEntry, LastUsedTheme } from "./types.ts";
import type { SyncServerConfig } from "@/types/sync.ts";
import { getSystemPreferredTheme } from "@/lib/theme-definitions.ts";

const WORKSPACE_LIST_KEY = "workspace-list";
const SYNC_SERVERS_KEY = "sync-servers";
const CLOUD_SYNC_KEY = "cloud-sync";

type PersistedWorkspaceListState = {
  state: {
    workspaces: WorkspaceListEntry[];
    activeWorkspaceId: string | null;
    theme: LastUsedTheme;
  };
  version: number;
};

type PersistedSyncState = {
  state: {
    serversByWorkspace: Record<string, SyncServerConfig[]>;
  };
  version: number;
};

type PersistedCloudSyncState = {
  state: {
    enabledWorkspaces: Record<string, boolean>;
  };
  version: number;
};

function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function createLocalStoragePersistence(): PersistenceDriver {
  // Helper to read the raw persisted workspace-list Zustand state
  function loadWsListState(): PersistedWorkspaceListState["state"] {
    const data = loadJson<PersistedWorkspaceListState>(WORKSPACE_LIST_KEY);
    return data?.state ?? { workspaces: [], activeWorkspaceId: null, theme: { theme: getSystemPreferredTheme() } };
  }

  function saveWsListState(state: PersistedWorkspaceListState["state"]) {
    localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify({ state, version: 0 }));
  }

  function loadSyncState(): PersistedSyncState["state"] {
    const data = loadJson<PersistedSyncState>(SYNC_SERVERS_KEY);
    return data?.state ?? { serversByWorkspace: {} };
  }

  function saveSyncState(state: PersistedSyncState["state"]) {
    localStorage.setItem(SYNC_SERVERS_KEY, JSON.stringify({ state, version: 0 }));
  }

  function loadCloudState(): PersistedCloudSyncState["state"] {
    const data = loadJson<PersistedCloudSyncState>(CLOUD_SYNC_KEY);
    return data?.state ?? { enabledWorkspaces: {} };
  }

  function saveCloudState(state: PersistedCloudSyncState["state"]) {
    localStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify({ state, version: 0 }));
  }

  return {
    loadWorkspaceList() {
      return loadWsListState().workspaces;
    },

    saveWorkspaceList(entries) {
      const state = loadWsListState();
      state.workspaces = entries;
      saveWsListState(state);
    },

    loadActiveWorkspaceId() {
      return loadWsListState().activeWorkspaceId;
    },

    saveActiveWorkspaceId(id) {
      const state = loadWsListState();
      state.activeWorkspaceId = id;
      saveWsListState(state);
    },

    loadLastUsedTheme() {
      return loadWsListState().theme ?? { theme: "dark" };
    },

    saveLastUsedTheme(theme) {
      const state = loadWsListState();
      state.theme = theme;
      saveWsListState(state);
    },

    loadLocalSettings(workspaceId) {
      const syncState = loadSyncState();
      const cloudState = loadCloudState();
      return {
        servers: syncState.serversByWorkspace[workspaceId] ?? [],
        cloudSyncEnabled: cloudState.enabledWorkspaces[workspaceId] ?? false,
      };
    },

    saveLocalSettings(workspaceId, settings) {
      const syncState = loadSyncState();
      syncState.serversByWorkspace[workspaceId] = settings.servers;
      saveSyncState(syncState);

      const cloudState = loadCloudState();
      cloudState.enabledWorkspaces[workspaceId] = settings.cloudSyncEnabled;
      saveCloudState(cloudState);
    },

    removeLocalSettings(workspaceId) {
      const syncState = loadSyncState();
      delete syncState.serversByWorkspace[workspaceId];
      saveSyncState(syncState);

      const cloudState = loadCloudState();
      delete cloudState.enabledWorkspaces[workspaceId];
      saveCloudState(cloudState);
    },

    loadWorkspaceDocUrl(workspaceId) {
      return localStorage.getItem(`tasks-ws-${workspaceId}-url`);
    },

    saveWorkspaceDocUrl(workspaceId, url) {
      localStorage.setItem(`tasks-ws-${workspaceId}-url`, url);
    },

    removeWorkspaceDocUrl(workspaceId) {
      localStorage.removeItem(`tasks-ws-${workspaceId}-url`);
    },
  };
}
