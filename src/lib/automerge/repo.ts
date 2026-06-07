import { Repo } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, ThemeSettings } from "@/types/data-model";
import { createWorkspace } from "@/lib/data-model";

export function createWorkspaceRepo(databaseName: string, messagePort?: MessagePort): Repo {
  const storage = new IndexedDBStorageAdapter(databaseName);
  return new Repo({
    storage,
    network: messagePort ? [new MessageChannelNetworkAdapter(messagePort)] : [],
  });
}

// --- Repo handoff ---
// When SyncInProgressStep finishes syncing, it can park the fully-initialised
// repo here instead of shutting it down.  WorkspaceProvider picks it up so it
// doesn't have to open a brand-new IndexedDB connection (which can race with
// the just-closed one and cause "Document unavailable" errors).

let pendingRepo: { databaseName: string; repo: Repo } | null = null;
let pendingRepoTimer: ReturnType<typeof setTimeout> | null = null;
const PENDING_REPO_TTL_MS = 30_000;

export function parkRepo(databaseName: string, repo: Repo) {
  if (pendingRepo?.repo && pendingRepo.repo !== repo) {
    void pendingRepo.repo.shutdown();
  }
  if (pendingRepoTimer) {
    clearTimeout(pendingRepoTimer);
  }
  pendingRepo = { databaseName, repo };
  pendingRepoTimer = setTimeout(() => {
    if (pendingRepo?.repo === repo) {
      pendingRepo = null;
      void repo.shutdown();
    }
    pendingRepoTimer = null;
  }, PENDING_REPO_TTL_MS);
}

export function claimRepo(databaseName: string): Repo | null {
  if (pendingRepo && pendingRepo.databaseName === databaseName) {
    const repo = pendingRepo.repo;
    pendingRepo = null;
    if (pendingRepoTimer) {
      clearTimeout(pendingRepoTimer);
      pendingRepoTimer = null;
    }
    return repo;
  }
  return null;
}

export function createWorkspaceDoc(
  repo: Repo,
  name: string,
  theme?: ThemeSettings,
): { handle: DocHandle<Workspace>; url: string } {
  const handle = repo.create<Workspace>();
  handle.change((doc) => {
    const workspace = createWorkspace(name, theme);
    Object.assign(doc, workspace);
  });
  return { handle, url: handle.url };
}

export function workspaceUrlKey(workspaceId: string): string {
  return `tasks-ws-${workspaceId}-url`;
}
