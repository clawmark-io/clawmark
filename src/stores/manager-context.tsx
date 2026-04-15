import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { WorkspacesManager } from "@/lib/workspace/workspace-manager.ts";
import type { WorkspaceClient } from "@/lib/workspace/workspace-client.ts";

// --- WorkspacesManager context (app-level) ---

const ManagerContext = createContext<WorkspacesManager | null>(null);

type ManagerProviderProps = {
  manager: WorkspacesManager;
  children: ReactNode;
};

export function ManagerProvider({ manager, children }: ManagerProviderProps) {
  return <ManagerContext value={manager}>{children}</ManagerContext>;
}

export function useManager(): WorkspacesManager {
  const ctx = useContext(ManagerContext);
  if (!ctx) {
    throw new Error("useManager must be used within a ManagerProvider");
  }
  return ctx;
}

// --- WorkspaceClient context (workspace-level) ---

const WorkspaceClientContext = createContext<WorkspaceClient | null>(null);

type WorkspaceClientProviderProps = {
  client: WorkspaceClient | null;
  children: ReactNode;
};

export function WorkspaceClientProvider({ client, children }: WorkspaceClientProviderProps) {
  return <WorkspaceClientContext value={client}>{children}</WorkspaceClientContext>;
}

export function useWorkspaceClient(): WorkspaceClient {
  const ctx = useContext(WorkspaceClientContext);
  if (!ctx) {
    throw new Error("useWorkspaceClient must be used within a WorkspaceClientProvider with a loaded client");
  }
  return ctx;
}

export function useOptionalWorkspaceClient(): WorkspaceClient | null {
  return useContext(WorkspaceClientContext);
}
