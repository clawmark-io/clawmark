import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";
import type { ThemeName, CustomThemeColors } from "@/types/theme";
import type { WorkspacesManager } from "@/lib/workspace/workspace-manager.ts";
import type { WorkspaceClient } from "@/lib/workspace/workspace-client.ts";
import { WorkspaceClientProvider } from "@/stores/manager-context";
import { useThemeStore } from "@/stores/theme-store";
import {
  subscribeAuthChange,
  isCloudSyncSignedIn,
  getAuthVersion,
} from "@/lib/cloud-sync/cloud-sync-auth";
import { updateTheme } from "@/lib/workspace/actions/theme/update-theme";
import { updateCustomColors } from "@/lib/workspace/actions/theme/update-custom-colors";

type WorkspaceContextValue = {
  workspace: Workspace | undefined;
  workspaceId: string;
  handle: DocHandle<Workspace> | null;

  // FIXME: These theme actions cause side-effects (syncing to theme store) which is not ideal
  updateTheme: (theme: ThemeName) => void;
  updateCustomColors: (colors: CustomThemeColors) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type WorkspaceProviderProps = {
  workspaceId: string;
  manager: WorkspacesManager;
  children: ReactNode;
};

export function WorkspaceProvider({ workspaceId, manager, children }: WorkspaceProviderProps) {
  const [client, setClient] = useState<WorkspaceClient | null>(null);
  const clientRef = useRef<WorkspaceClient | null>(null);

  // Keep the getWorkspace promise in a ref so StrictMode's
  // mount → cleanup → remount reuses the same promise instead of
  // racing two parallel getWorkspace calls (which causes the second
  // to fail with "Document unavailable" after the first shuts down).
  const inflightRef = useRef<{ workspaceId: string; promise: Promise<WorkspaceClient> } | null>(null);

  // Open/close workspace client via manager
  useEffect(() => {
    let cancelled = false;
    let activeClient: WorkspaceClient | null = null;

    let promise: Promise<WorkspaceClient>;
    if (inflightRef.current?.workspaceId === workspaceId) {
      promise = inflightRef.current.promise;
    } else {
      promise = manager.getWorkspace(workspaceId, { loadServices: true });
      inflightRef.current = { workspaceId, promise };
    }

    promise.then((c) => {
      if (cancelled) return;
      inflightRef.current = null;
      activeClient = c;
      clientRef.current = c;
      setClient(c);

      // Start background processes (auto-archive, snooze reveal)
      c.startBackgroundProcesses();

      // Connect automatic sync servers
      c.connectAutomaticServers();
    }).catch(() => {
      if (!cancelled) inflightRef.current = null;
    });

    // Update lastAccessedAt
    manager.updateWorkspaceMetadata(workspaceId, { lastAccessedAt: Date.now() });

    return () => {
      cancelled = true;
      if (activeClient) {
        activeClient.stopBackgroundProcesses();
        manager.releaseWorkspace(activeClient);
      }
      clientRef.current = null;
      setClient(null);
    };
  }, [workspaceId, manager]);

  // Subscribe to workspace doc changes via the client's doc store
  const workspace = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        if (!client) return () => {};
        return client.doc.subscribe(onStoreChange);
      },
      [client],
    ),
    useCallback(() => client?.doc.get() ?? undefined, [client]),
  );

  // Cloud sync connection management
  const signedIn = useSyncExternalStore(subscribeAuthChange, isCloudSyncSignedIn, isCloudSyncSignedIn);
  const authVersion = useSyncExternalStore(subscribeAuthChange, getAuthVersion, getAuthVersion);

  useEffect(() => {
    if (!client) return;
    const settings = client.settings.get();
    const shouldConnect = settings.cloudSyncEnabled && signedIn;

    if (shouldConnect) {
      client.connectCloudSync();
    } else {
      client.disconnectCloudSync();
    }

    return () => {
      client.disconnectCloudSync();
    };
  }, [client, signedIn, authVersion]);

  // Sync workspace metadata to workspace list (name, projectNames, defaultView)
  const projectCount = workspace ? Object.keys(workspace.projects).length : 0;
  const defaultView = workspace?.defaultView;
  useEffect(() => {
    if (!workspace) return;

    const projectNames = Object.values(workspace.projects).map((p) => p.title);
    manager.updateWorkspaceMetadata(workspaceId, {
      name: workspace.name,
      projectNames,
      defaultView: workspace.defaultView,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We track workspace?.name, projectCount, and defaultView instead of the full workspace object to avoid re-running on every workspace mutation.
  }, [workspace?.name, projectCount, defaultView, workspaceId, manager]);

  // Sync theme from workspace doc to theme store on load / change
  const setTheme = useThemeStore((s) => s.setTheme);
  const setCustomColors = useThemeStore((s) => s.setCustomColors);
  const workspaceTheme = workspace?.theme?.theme;
  const workspaceCustomColors = workspace?.theme?.customColors;

  useEffect(() => {
    if (!workspaceTheme) return;
    setTheme(workspaceTheme);
    if (workspaceCustomColors) {
      setCustomColors(workspaceCustomColors);
    }
    manager.setLastUsedTheme({
      theme: workspaceTheme,
      customColors: workspaceCustomColors,
    });
  }, [workspaceTheme, workspaceCustomColors, manager, setTheme, setCustomColors]);

  const getHandle = useCallback(() => {
    return clientRef.current?.getHandle() ?? null;
  }, []);

  // Theme actions include side-effects (syncing to theme-store)
  const updateThemeFn = useCallback((theme: ThemeName) => {
    setTheme(theme);
    const h = getHandle();
    if (!h) return;
    updateTheme(h, theme);
    manager.setLastUsedTheme({ theme, customColors: workspace?.theme?.customColors });
  }, [setTheme, getHandle, manager, workspace?.theme?.customColors]);

  const updateCustomColorsFn = useCallback((colors: CustomThemeColors) => {
    setCustomColors(colors);
    const h = getHandle();
    if (!h) return;
    updateCustomColors(h, colors);
    manager.setLastUsedTheme({ theme: workspace?.theme?.theme ?? "custom", customColors: colors });
  }, [setCustomColors, getHandle, manager, workspace?.theme?.theme]);

  const contextValue = useMemo(() => ({
    workspace,
    workspaceId,
    handle: getHandle(),
    updateTheme: updateThemeFn,
    updateCustomColors: updateCustomColorsFn,
  }), [workspace, workspaceId, getHandle, updateThemeFn, updateCustomColorsFn]);

  return (
    <WorkspaceClientProvider client={client}>
      <WorkspaceContext value={contextValue}>
        {children}
      </WorkspaceContext>
    </WorkspaceClientProvider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

export function useOptionalWorkspace() {
  return useContext(WorkspaceContext);
}
