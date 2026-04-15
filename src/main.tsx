import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./index.css";
import "./i18n";
import { Repo, type AnyDocumentId } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { debug } from "@/lib/devtools";
import { createAppRouter } from "@/router";
import { WorkspacesManager } from "@/lib/workspace/workspace-manager";
import { createLocalStoragePersistence } from "@/lib/workspace/drivers/local-storage-persistence";
import { getFilesystemDriver } from "@/lib/workspace/drivers/runtime-driver";
import { setDevtoolsManager } from "@/lib/devtools";

function createManager(): WorkspacesManager {
  const m = new WorkspacesManager({
    fs: getFilesystemDriver(),
    createStorageAdapter: (databaseName) => new IndexedDBStorageAdapter(databaseName),
    persistence: createLocalStoragePersistence(),
  });
  setDevtoolsManager(m);
  return m;
}

async function dumpWorkspaceFromIndexDB(
  workspaceId: string,
  workspaceUrl: string,
): Promise<void> {
  const databaseName = `tasks-ws-${workspaceId}`;
  console.log(`[debug-dump] Loading workspace "${workspaceId}" from IndexedDB (db: ${databaseName})...`);
  console.log(`[debug-dump] Document URL: ${workspaceUrl}`);

  const storage = new IndexedDBStorageAdapter(databaseName);
  const repo = new Repo({ storage });

  try {
    const handle = await repo.find(workspaceUrl as AnyDocumentId);
    await handle.whenReady();
    const doc = handle.doc();

    if (doc) {
      console.log(`[debug-dump] Document JSON:`);
      console.log(JSON.parse(JSON.stringify(doc)));
    } else {
      console.warn(`[debug-dump] Document handle ready but doc() returned null/undefined.`);
    }
  } catch (err) {
    console.error(`[debug-dump] Failed to load document:`, err);
  } finally {
    repo.shutdown();
    console.log(`[debug-dump] Repo shut down.`);
  }
}

(window as unknown as Record<string, unknown>).dumpWorkspaceFromIndexDB = dumpWorkspaceFromIndexDB;
(window as unknown as Record<string, unknown>).debug = debug;

const manager = createManager();
const router = createAppRouter(manager);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
