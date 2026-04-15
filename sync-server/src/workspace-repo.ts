import { type AnyDocumentId, type DocHandle, Repo, type PeerId } from "@automerge/automerge-repo";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket";
import { WebSocketServer } from "ws";
import type { WebSocketServer as IsomorphicWSS } from "isomorphic-ws";
import { join } from "node:path";
import { mkdirSync, readdirSync, createReadStream, type ReadStream } from "node:fs";
import { writeFile, unlink, mkdir, stat } from "node:fs/promises";
import type { WorkspaceIndexStore } from "./workspace-index/types.js";
import type { Logger } from "./logging.js";

type WorkspaceEntry = {
  repo: Repo;
  wss: WebSocketServer;
  adapter: NodeWSServerAdapter;
  presentImages: Set<string>;
};

function collectReferencedImageUuids(doc: Record<string, unknown>): Set<string> {
  const uuids = new Set<string>();
  const projects = doc.projects as Record<string, Record<string, unknown>> | undefined;
  if (!projects) return uuids;
  for (const project of Object.values(projects)) {
    if (typeof project.backgroundVersion === "string") uuids.add(project.backgroundVersion);
    if (typeof project.logoVersion === "string") uuids.add(project.logoVersion);
  }
  return uuids;
}

export class WorkspaceRepoManager {
  private readonly workspaces = new Map<string, WorkspaceEntry>();
  private readonly trackedHandles = new Set<string>();
  private readonly previousImageUuids = new Map<string, Set<string>>();
  private readonly storagePath: string;
  private readonly indexStore: WorkspaceIndexStore;
  private readonly logger: Logger;

  constructor(storagePath: string, indexStore: WorkspaceIndexStore, logger: Logger) {
    this.storagePath = storagePath;
    this.indexStore = indexStore;
    this.logger = logger;
  }

  private imagesDir(workspaceId: string): string {
    return join(this.storagePath, "workspaces", workspaceId, "images");
  }

  async getOrCreate(workspaceId: string): Promise<WorkspaceEntry> {
    const existing = this.workspaces.get(workspaceId);
    if (existing) return existing;

    const workspacePath = join(this.storagePath, "workspaces", workspaceId, "workspace");
    mkdirSync(workspacePath, { recursive: true });

    // Initialize images directory and populate presentImages set
    const imagesPath = this.imagesDir(workspaceId);
    mkdirSync(imagesPath, { recursive: true });
    const presentImages = new Set<string>();
    try {
      for (const file of readdirSync(imagesPath)) {
        presentImages.add(file);
      }
    } catch {
      // Directory read failed — start with empty set
    }

    const storage = new NodeFSStorageAdapter(workspacePath);
    const wss = new WebSocketServer({ noServer: true });
    const adapter = new NodeWSServerAdapter(wss as unknown as IsomorphicWSS);

    const repo = new Repo({
      network: [adapter],
      storage,
      peerId: `sync-server-${workspaceId}` as PeerId,
      sharePolicy: async () => true,
    });

    const entry: WorkspaceEntry = { repo, wss, adapter, presentImages };
    this.workspaces.set(workspaceId, entry);

    // Pre-load workspace document from storage so it can be shared with connecting peers.
    // Without this, the repo's handle map is empty and sharePolicy has nothing to share.
    const indexed = await this.indexStore.get(workspaceId);
    if (indexed?.documentUrl) {
      try {
        const handle = await repo.find(indexed.documentUrl as AnyDocumentId);
        await handle.whenReady();
        this.logger.info(`Pre-loaded document for workspace: ${workspaceId} (${indexed.documentUrl})`);
      } catch (err) {
        this.logger.warn(`Failed to pre-load document for workspace ${workspaceId}: ${err}`);
      }
    }

    this.logger.info(`Created repo for workspace: ${workspaceId} (${presentImages.size} images on disk)`);
    return entry;
  }

  /**
   * Scan the repo for workspace documents and update the index.
   * Called after a sync connection is established and has had time to exchange data.
   */
  async updateIndex(workspaceId: string): Promise<void> {
    const entry = this.workspaces.get(workspaceId);
    if (!entry) return;

    const handles = entry.repo.handles;
    for (const [url, handle] of Object.entries(handles)) {
      const docHandle = handle as DocHandle<Record<string, unknown>>;

      // Wait for the handle to be ready (may still be loading from storage/network)
      try {
        await docHandle.whenReady();
      } catch {
        continue;
      }

      const doc = docHandle.doc();
      if (doc && typeof doc.name === "string") {
        const documentUrl = docHandle.url;
        await this.indexStore.upsert({
          workspaceId,
          name: doc.name,
          documentUrl,
          lastSyncedAt: new Date().toISOString(),
        });
        this.logger.info(`Updated workspace index: ${workspaceId} -> "${doc.name}" (${documentUrl})`);

        if (!this.trackedHandles.has(url)) {
          this.trackedHandles.add(url);

          // Initialize image tracking for reactive GC
          this.previousImageUuids.set(workspaceId, collectReferencedImageUuids(doc));

          docHandle.on("change", async ({ doc: updatedDoc }) => {
            const docRecord = updatedDoc as Record<string, unknown> | undefined;

            // Update workspace name index
            if (docRecord && typeof docRecord.name === "string") {
              await this.indexStore.upsert({
                workspaceId,
                name: docRecord.name as string,
                documentUrl,
                lastSyncedAt: new Date().toISOString(),
              });
            }

            // Reactive image GC: detect images that became unreferenced
            if (docRecord) {
              const newUuids = collectReferencedImageUuids(docRecord);
              const prevUuids = this.previousImageUuids.get(workspaceId);
              this.previousImageUuids.set(workspaceId, newUuids);

              if (prevUuids) {
                const wsEntry = this.workspaces.get(workspaceId);
                if (wsEntry) {
                  for (const uuid of prevUuids) {
                    if (!newUuids.has(uuid) && wsEntry.presentImages.has(uuid)) {
                      const filePath = join(this.imagesDir(workspaceId), uuid);
                      try {
                        await unlink(filePath);
                        wsEntry.presentImages.delete(uuid);
                        this.logger.info(`Image GC: deleted ${uuid} from workspace ${workspaceId}`);
                      } catch {
                        // File may already be deleted
                      }
                    }
                  }
                }
              }
            }
          });
        }
      }
    }
  }

  // ── Image I/O ──────────────────────────────────────────────────────────

  async putImage(workspaceId: string, uuid: string, data: Buffer): Promise<void> {
    const dir = this.imagesDir(workspaceId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, uuid), data);

    const entry = this.workspaces.get(workspaceId);
    if (entry) {
      entry.presentImages.add(uuid);
    }
  }

  async getImage(workspaceId: string, uuid: string): Promise<ReadStream | null> {
    const filePath = join(this.imagesDir(workspaceId), uuid);
    try {
      await stat(filePath);
      return createReadStream(filePath);
    } catch {
      return null;
    }
  }

  listImages(workspaceId: string): string[] {
    const entry = this.workspaces.get(workspaceId);
    if (entry) {
      return [...entry.presentImages];
    }
    // Fallback to filesystem if workspace not yet loaded
    try {
      return readdirSync(this.imagesDir(workspaceId));
    } catch {
      return [];
    }
  }

  // ── Image GC ───────────────────────────────────────────────────────────

  /**
   * Startup / periodic GC: for every loaded workspace, delete image files
   * that are not referenced by any project in the CRDT document.
   */
  async runImageGc(): Promise<void> {
    for (const [workspaceId, entry] of this.workspaces) {
      const referencedUuids = new Set<string>();

      for (const handle of Object.values(entry.repo.handles)) {
        const docHandle = handle as DocHandle<Record<string, unknown>>;
        const doc = docHandle.doc();
        if (doc) {
          for (const uuid of collectReferencedImageUuids(doc)) {
            referencedUuids.add(uuid);
          }
        }
      }

      let deleted = 0;
      for (const uuid of entry.presentImages) {
        if (!referencedUuids.has(uuid)) {
          try {
            await unlink(join(this.imagesDir(workspaceId), uuid));
            entry.presentImages.delete(uuid);
            deleted++;
          } catch {
            // File may already be deleted
          }
        }
      }

      if (deleted > 0) {
        this.logger.info(`Image GC: deleted ${deleted} orphaned image(s) from workspace ${workspaceId}`);
      }

      // Keep reactive GC in sync
      this.previousImageUuids.set(workspaceId, referencedUuids);
    }
  }

  // ── Debug / introspection ──────────────────────────────────────────────

  /**
   * Debug: load every indexed workspace and dump the full document JSON to the console.
   */
  async dumpAllWorkspaces(): Promise<void> {
    const entries = await this.indexStore.getAll();
    if (entries.length === 0) {
      this.logger.info("[debug-dump] No workspaces in index.");
      return;
    }

    this.logger.info(`[debug-dump] Found ${entries.length} workspace(s) in index.`);

    for (const entry of entries) {
      this.logger.info(`[debug-dump] --- Workspace: ${entry.workspaceId} (name: "${entry.name}") ---`);
      this.logger.info(`[debug-dump]   documentUrl: ${entry.documentUrl ?? "(none)"}`);
      this.logger.info(`[debug-dump]   lastSyncedAt: ${entry.lastSyncedAt}`);

      if (!entry.documentUrl) {
        this.logger.info(`[debug-dump]   ⚠ No documentUrl — skipping document load.`);
        continue;
      }

      try {
        const wsEntry = await this.getOrCreate(entry.workspaceId);
        const handle = await wsEntry.repo.find(entry.documentUrl as AnyDocumentId);
        await handle.whenReady();
        const doc = handle.doc();

        if (doc) {
          const json = JSON.stringify(doc, null, 2);
          this.logger.info(`[debug-dump]   Document JSON:\n${json}`);
        } else {
          this.logger.info(`[debug-dump]   ⚠ Document handle ready but doc() returned null/undefined.`);
        }
      } catch (err) {
        this.logger.info(`[debug-dump]   ✗ Failed to load document: ${err}`);
      }
    }

    this.logger.info("[debug-dump] Done.");
  }

  getWorkspaceIds(): string[] {
    return Array.from(this.workspaces.keys());
  }
}
