import type { SyncServerConfig } from "@/types/sync.ts";
import type { ThemeName, CustomThemeColors } from "@/types/theme.ts";
import type { WorkspaceDefaultView } from "@/types/data-model";

export type FilesystemDriver = {
  write(workspaceId: string, path: string, data: Blob): Promise<void>;
  read(workspaceId: string, path: string): Promise<Blob | null>;
  readAsDataUrl(workspaceId: string, path: string): Promise<string | null>;
  remove(workspaceId: string, path: string): Promise<void>;
  exists(workspaceId: string, path: string): Promise<boolean>;
  removeDirectory(workspaceId: string, directory: string): Promise<void>;
};

export type WorkspaceLocalSettings = {
  servers: SyncServerConfig[];
  cloudSyncEnabled: boolean;
};

export type WorkspaceListEntry = {
  workspaceId: string;
  databaseName: string;
  name: string;
  lastAccessedAt: number;
  projectNames: string[];
  defaultView?: WorkspaceDefaultView;
};

export type LastUsedTheme = {
  theme: ThemeName;
  customColors?: CustomThemeColors;
};

export type PersistenceDriver = {
  loadWorkspaceList(): WorkspaceListEntry[];
  saveWorkspaceList(entries: WorkspaceListEntry[]): void;
  loadActiveWorkspaceId(): string | null;
  saveActiveWorkspaceId(id: string | null): void;
  loadLastUsedTheme(): LastUsedTheme;
  saveLastUsedTheme(theme: LastUsedTheme): void;
  loadLocalSettings(workspaceId: string): WorkspaceLocalSettings;
  saveLocalSettings(workspaceId: string, settings: WorkspaceLocalSettings): void;
  removeLocalSettings(workspaceId: string): void;
  loadWorkspaceDocUrl(workspaceId: string): string | null;
  saveWorkspaceDocUrl(workspaceId: string, url: string): void;
  removeWorkspaceDocUrl(workspaceId: string): void;
};
