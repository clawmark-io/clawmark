import { generateId } from "@/lib/utils/id";
import type { AnyDocumentId } from "@automerge/automerge-repo";
import type { Workspace, Project, ThemeSettings } from "@/types/data-model.ts";
import { cloneProject } from "@/lib/workspace/project-clone.ts";
import type { CloneOptions } from "@/lib/workspace/project-clone.ts";
import { loadImageAsBlob, saveImage } from "@/lib/utils/opfs.ts";
import { createWorkspaceRepo, createWorkspaceDoc, workspaceUrlKey } from "@/lib/automerge/repo.ts";
import type { WorkspacesManager } from "@/lib/workspace/workspace-manager.ts";

/**
 * Recursively strip `undefined` values from an object.
 * Automerge does not accept `undefined` — only valid JSON types.
 */
function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined) as T;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      clean[key] = stripUndefined(value);
    }
  }
  return clean as T;
}

export type WorkspaceCloneOptions = {
  cloneTasks: boolean;
  copyImages: boolean;
};

export const DEFAULT_WORKSPACE_CLONE_OPTIONS: WorkspaceCloneOptions = {
  cloneTasks: true,
  copyImages: true,
};

/**
 * Open a workspace's Automerge repo and read its document.
 * The caller MUST call `repo.shutdown()` when done.
 */
export async function openWorkspaceDoc(
  workspaceId: string,
  databaseName: string,
): Promise<{ workspace: Workspace; repo: { shutdown: () => void } }> {
  const url = localStorage.getItem(workspaceUrlKey(workspaceId));
  if (!url) throw new Error("Source workspace not found");

  const repo = createWorkspaceRepo(databaseName);

  // repo.find() returns a thenable DocHandle; await to get the resolved handle,
  // then wait for IndexedDB to finish loading the document data.
  const handle = await repo.find<Workspace>(url as AnyDocumentId);
  await handle.whenReady();

  const doc = handle.doc();
  if (!doc) {
    repo.shutdown();
    throw new Error("Could not read workspace data");
  }

  return { workspace: doc as Workspace, repo };
}

/**
 * Clone selected projects from a source workspace into a brand-new workspace.
 * Opens the source repo internally and keeps it alive while reading project data.
 * Returns metadata for the newly created workspace.
 */
export async function cloneWorkspaceProjects(
  manager: WorkspacesManager,
  sourceWorkspaceId: string,
  sourceDatabaseName: string,
  selectedProjectIds: string[],
  name: string,
  theme: ThemeSettings,
  options: WorkspaceCloneOptions,
): Promise<{ workspaceId: string; databaseName: string; projectNames: string[] }> {
  // Open source workspace — repo stays alive so Automerge proxies remain valid
  const { workspace: sourceWorkspace, repo: sourceRepo } = await openWorkspaceDoc(
    sourceWorkspaceId,
    sourceDatabaseName,
  );

  const workspaceId = generateId();
  const databaseName = `tasks-ws-${workspaceId}`;

  // Build clone options for cloneProject
  const projectCloneOptions: CloneOptions = {
    columns: true,
    tags: true,
    openTasks: options.cloneTasks,
    completedTasks: options.cloneTasks,
    visualSettings: true,
  };

  // Clone each selected project while source repo is still alive
  let clonedProjects: Project[] = [];
  try {
    const sources = selectedProjectIds
      .map((id, index) => ({ source: sourceWorkspace.projects[id], index }))
      .filter((s): s is { source: Project; index: number } => !!s.source);

    clonedProjects = await Promise.all(
      sources.map(async ({ source, index }) => {
        const cloned = cloneProject(workspaceId, source, source.title, projectCloneOptions);
        cloned.sortOrder = index;

        // Handle images
        if (options.copyImages) {
          // Copy image blobs from source workspace OPFS to new workspace OPFS
          // Generate new UUIDs so the new workspace owns its own copies
          if (source.backgroundVersion) {
            const blob = await loadImageAsBlob(sourceWorkspaceId, source.backgroundVersion);
            if (blob) {
              const newUuid = generateId();
              await saveImage(workspaceId, newUuid, blob);
              cloned.backgroundVersion = newUuid;
              cloned.backgroundMimeType = source.backgroundMimeType;
            }
          }
          if (source.logoVersion) {
            const blob = await loadImageAsBlob(sourceWorkspaceId, source.logoVersion);
            if (blob) {
              const newUuid = generateId();
              await saveImage(workspaceId, newUuid, blob);
              cloned.logoVersion = newUuid;
              cloned.logoMimeType = source.logoMimeType;
            }
          }
        } else {
          // Strip image references when not copying
          cloned.backgroundVersion = undefined;
          cloned.backgroundMimeType = undefined;
          cloned.logoVersion = undefined;
          cloned.logoMimeType = undefined;
        }

        return cloned;
      }),
    );
  } finally {
    // Source repo can be shut down now — all data has been read into plain JS objects
    sourceRepo.shutdown();
  }

  // Create workspace repo + doc
  const repo = createWorkspaceRepo(databaseName);
  const { handle, url } = createWorkspaceDoc(repo, name, theme);

  handle.change((doc) => {
    for (const project of clonedProjects) {
      // Automerge rejects `undefined` values — strip them before writing
      doc.projects[project.id] = stripUndefined(project);
    }
    doc.updatedAt = Date.now();
  });

  manager.saveWorkspaceDocUrl(workspaceId, url);
  repo.shutdown();

  // Register in workspace list
  const projectNames = clonedProjects.map((p) => p.title);
  manager.addWorkspaceEntry({
    workspaceId,
    databaseName,
    name,
    lastAccessedAt: Date.now(),
    projectNames,
  });

  return { workspaceId, databaseName, projectNames };
}
