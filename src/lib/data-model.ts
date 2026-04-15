import { generateId } from "@/lib/utils/id";
import type { Workspace, Project, Column, Task, Tag, ThemeSettings } from "@/types/data-model";

export function createWorkspace(name: string, theme?: ThemeSettings): Workspace {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    projects: {},
    theme: theme ?? { theme: "dark" },
  };
}

export function createProject(title: string): Project {
  const now = Date.now();
  const defaultColumn = createColumn("To Do");
  defaultColumn.sortOrder = 0;

  return {
    id: generateId(),
    kanbanEnabled: true,
    title,
    description: "",
    backgroundBlur: 0,
    backgroundSepia: 0,
    backgroundGrayscale: 0,
    backgroundOpacity: 100,
    defaultTaskColors: [],
    customTaskColors: [],
    tags: [],
    columns: [defaultColumn],
    defaultColumnId: defaultColumn.id,
    newTaskInputOnTop: false,
    tasks: {},
    dueDateDisplayMode: "date",
    autoArchive: false,
    autoArchiveDays: 7,
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
  };
}

export function createColumn(title: string): Column {
  return {
    id: generateId(),
    title,
    color: null,
    backgroundColor: null,
    sortOrder: 0,
    autoComplete: false,
    taskLimit: null,
    hiddenOnKanban: false,
  };
}

export function createTask(title: string): Task {
  const now = Date.now();
  return {
    id: generateId(),
    title,
    emoji: null,
    description: "",
    color: null,
    columnId: null,
    sortOrder: 0,
    completed: false,
    archived: false,
    dueDate: null,
    snoozeUntil: null,
    tags: [],
    subtasks: [],
    notes: [],
    completedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function sanitizeTagLabel(label: string): string {
  return label.replace(/ /g, "-");
}

export function createTag(label: string, color: string): Tag {
  return {
    id: generateId(),
    label: sanitizeTagLabel(label),
    color,
  };
}
