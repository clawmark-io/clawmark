import { generateId } from "@/lib/utils/id";
import { createProject, createColumn, createTag } from "@/lib/data-model.ts";
import type { Project, Task } from "@/types/data-model.ts";

export type CloneOptions = {
  columns: boolean;
  tags: boolean;
  openTasks: boolean;
  completedTasks: boolean;
  visualSettings: boolean;
};

export const DEFAULT_CLONE_OPTIONS: CloneOptions = {
  columns: true,
  tags: true,
  openTasks: true,
  completedTasks: false,
  visualSettings: true,
};

export function cloneProject(
  _workspaceId: string,
  source: Project,
  name: string,
  options: CloneOptions,
): Project {
  const project = createProject(name);

  // Column mapping: oldId → newId
  const columnMap = new Map<string, string>();

  if (options.columns) {
    const clonedColumns = source.columns.map((col) => {
      const newCol = createColumn(col.title);
      newCol.color = col.color;
      newCol.backgroundColor = col.backgroundColor;
      newCol.sortOrder = col.sortOrder;
      newCol.autoComplete = col.autoComplete;
      newCol.taskLimit = col.taskLimit;
      newCol.hiddenOnKanban = col.hiddenOnKanban;
      columnMap.set(col.id, newCol.id);
      return newCol;
    });
    project.columns = clonedColumns;
    // Set defaultColumnId to the mapped value of the source's default, or first column
    if (source.defaultColumnId && columnMap.has(source.defaultColumnId)) {
      project.defaultColumnId = columnMap.get(source.defaultColumnId)!;
    } else {
      project.defaultColumnId = clonedColumns[0]?.id ?? null;
    }
  }

  // Tag mapping: oldId → newId
  const tagMap = new Map<string, string>();

  if (options.tags) {
    const clonedTags = source.tags.map((tag) => {
      const newTag = createTag(tag.label, tag.color);
      tagMap.set(tag.id, newTag.id);
      return newTag;
    });
    project.tags = clonedTags;
  }

  // Clone tasks
  const cloneTask = (task: Task): Task => {
    const now = Date.now();
    const newColumnId = task.columnId
      ? (options.columns ? (columnMap.get(task.columnId) ?? project.defaultColumnId) : project.defaultColumnId)
      : null;

    const newTags = options.tags
      ? task.tags.map((tagId) => tagMap.get(tagId)).filter((id): id is string => id !== undefined)
      : [];

    return {
      ...task,
      id: generateId(),
      columnId: newColumnId,
      tags: newTags,
      subtasks: task.subtasks.map((st) => ({ ...st, id: generateId() })),
      createdAt: now,
      updatedAt: now,
    };
  };

  const sourceTasks = Object.values(source.tasks);

  if (options.openTasks) {
    for (const task of sourceTasks) {
      if (!task.completed && !task.archived) {
        const cloned = cloneTask(task);
        project.tasks[cloned.id] = cloned;
      }
    }
  }

  if (options.completedTasks) {
    for (const task of sourceTasks) {
      if (task.completed && !task.archived) {
        const cloned = cloneTask(task);
        project.tasks[cloned.id] = cloned;
      }
    }
  }

  // Visual settings — just copy version fields; both projects share the same UUID
  if (options.visualSettings) {
    project.backgroundVersion = source.backgroundVersion;
    project.backgroundMimeType = source.backgroundMimeType;
    project.logoVersion = source.logoVersion;
    project.logoMimeType = source.logoMimeType;
    project.backgroundBlur = source.backgroundBlur;
    project.backgroundSepia = source.backgroundSepia;
    project.backgroundGrayscale = source.backgroundGrayscale;
    project.backgroundOpacity = source.backgroundOpacity;
    project.defaultTaskColors = [...source.defaultTaskColors];
    project.customTaskColors = [...source.customTaskColors];
  }

  return project;
}
