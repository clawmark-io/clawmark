export type WorkspaceIndexEntry = {
  workspaceId: string;
  name: string;
  documentUrl?: string; // automerge:... URL for pre-loading on startup
  lastSyncedAt: string; // ISO 8601
};

export interface WorkspaceIndexStore {
  getAll(): Promise<WorkspaceIndexEntry[]>;
  get(workspaceId: string): Promise<WorkspaceIndexEntry | undefined>;
  upsert(entry: WorkspaceIndexEntry): Promise<void>;
  delete(workspaceId: string): Promise<void>;
}
