import { readFile, writeFile, copyFile, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { WorkspaceIndexEntry, WorkspaceIndexStore } from "./types.js";
import type { Logger } from "../logging.js";

export class FileWorkspaceIndexStore implements WorkspaceIndexStore {
  private readonly filePath: string;
  private readonly backupsPath: string;
  private readonly maxBackups: number;
  private readonly logger: Logger;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(storagePath: string, maxBackups: number, logger: Logger) {
    this.filePath = join(storagePath, "workspace-index.json");
    this.backupsPath = join(storagePath, "backups");
    this.maxBackups = maxBackups;
    this.logger = logger;
  }

  async getAll(): Promise<WorkspaceIndexEntry[]> {
    const data = await this.readIndex();
    return data.workspaces;
  }

  async get(workspaceId: string): Promise<WorkspaceIndexEntry | undefined> {
    const data = await this.readIndex();
    return data.workspaces.find((w) => w.workspaceId === workspaceId);
  }

  async upsert(entry: WorkspaceIndexEntry): Promise<void> {
    await this.enqueueWrite(async () => {
      const data = await this.readIndex();
      const index = data.workspaces.findIndex((w) => w.workspaceId === entry.workspaceId);
      if (index >= 0) {
        data.workspaces[index] = entry;
      } else {
        data.workspaces.push(entry);
      }
      await this.writeIndex(data);
    });
  }

  async delete(workspaceId: string): Promise<void> {
    await this.enqueueWrite(async () => {
      const data = await this.readIndex();
      data.workspaces = data.workspaces.filter((w) => w.workspaceId !== workspaceId);
      await this.writeIndex(data);
    });
  }

  private async readIndex(): Promise<{ workspaces: WorkspaceIndexEntry[] }> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as { workspaces: WorkspaceIndexEntry[] };
    } catch {
      return { workspaces: [] };
    }
  }

  private async writeIndex(data: { workspaces: WorkspaceIndexEntry[] }): Promise<void> {
    // Create timestamped backup of current file
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = join(this.backupsPath, `workspace-index.${timestamp}.json`);
      await copyFile(this.filePath, backupPath);
    } catch {
      // No existing file to backup — that's fine
    }

    // Write new data
    await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");

    // Prune old backups
    await this.pruneBackups();
  }

  private async pruneBackups(): Promise<void> {
    try {
      const files = await readdir(this.backupsPath);
      const backups = files
        .filter((f) => f.startsWith("workspace-index.") && f.endsWith(".json"))
        .sort();

      if (backups.length <= this.maxBackups) return;

      const toDelete = backups.slice(0, backups.length - this.maxBackups);
      for (const file of toDelete) {
        await unlink(join(this.backupsPath, file));
      }

      this.logger.info(`Pruned ${toDelete.length} workspace index backups`);
    } catch {
      // Best-effort cleanup
    }
  }

  private enqueueWrite(fn: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue.then(fn, fn);
    return this.writeQueue;
  }
}
