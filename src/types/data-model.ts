import type { ThemeName, CustomThemeColors } from "@/types/theme";

export type DueDateDisplayMode = "date" | "day" | "time";

export type ThemeSettings = {
  theme: ThemeName;
  customColors?: CustomThemeColors;
};

export type WorkspaceDefaultView = "projects" | "upcoming";

export type Workspace = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  projects: Record<string, Project>;
  theme: ThemeSettings;
  defaultView?: WorkspaceDefaultView;
};

export type Project = {
  id: string;
  kanbanEnabled: boolean;
  title: string;
  description: string;
  backgroundVersion?: string;
  backgroundMimeType?: string;
  logoVersion?: string;
  logoMimeType?: string;
  backgroundBlur: number;
  backgroundSepia: number;
  backgroundGrayscale: number;
  backgroundOpacity: number;
  defaultTaskColors: string[];
  customTaskColors: string[];
  tags: Tag[];
  columns: Column[];
  defaultColumnId: string | null;
  newTaskInputOnTop: boolean;
  tasks: Record<string, Task>;
  dueDateDisplayMode: DueDateDisplayMode;
  autoArchive: boolean;
  autoArchiveDays: number;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
};

export function hasBackground(project: Project): boolean {
  return !!project.backgroundVersion;
}

export function hasLogo(project: Project): boolean {
  return !!project.logoVersion;
}

export type Tag = {
  id: string;
  label: string;
  color: string;
};

export type Column = {
  id: string;
  title: string;
  color: string | null;
  backgroundColor: string | null;
  sortOrder: number;
  autoComplete: boolean;
  taskLimit: number | null;
  hiddenOnKanban: boolean;
};

export type TaskNote = {
  id: string;
  createdAt: number;
  updatedAt?: number;
  note: string;
};

export type Task = {
  id: string;
  title: string;
  emoji: string | null;
  description: string;
  color: string | null;
  columnId: string | null;
  sortOrder: number;
  completed: boolean;
  archived: boolean;
  dueDate: number | null;
  snoozeUntil: number | null;
  tags: string[];
  subtasks: Subtask[];
  notes: TaskNote[];
  completedAt: number | null;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
};
