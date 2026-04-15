import { createProject, createTask, createColumn, createTag } from "@/lib/data-model";
import { generateId } from "@/lib/utils/id";
import type { Project } from "@/types/data-model";

export type CsvImportStats = {
  totalTasks: number;
  totalColumns: number;
  totalTags: number;
};

export type CsvImportResult =
  | { success: true; project: Project; stats: CsvImportStats }
  | { success: false; error: string };

const TAG_COLORS = [
  "#8be9fd", "#50fa7b", "#ffb86c", "#ff79c6",
  "#bd93f9", "#f1fa8c", "#ff5555", "#6272a4",
];

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\r") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
        if (i < text.length && text[i] === "\n") i++;
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function parseTimestamp(value: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function filenameWithoutExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export function processCsvFile(file: File, projectName?: string): Promise<CsvImportResult> {
  return file.text().then((text) => processCsvText(text, projectName ?? file.name));
}

export function processCsvText(text: string, projectName: string): CsvImportResult {
  try {
    // Strip UTF-8 BOM if present
    const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    const rows = parseCsvRows(clean);

    if (rows.length === 0) {
      return { success: false, error: "CSV file is empty" };
    }

    const headers = rows[0].map((h) => h.trim());
    const titleIndex = headers.indexOf("Title");

    if (titleIndex === -1) {
      return { success: false, error: 'CSV file must contain a "Title" column' };
    }

    const projectTitle = projectName.trim() || filenameWithoutExtension(projectName);
    const project = createProject(projectTitle);
    // Remove the default column — we'll create columns from CSV data
    project.columns = [];
    project.defaultColumnId = null;

    const columnMap = new Map<string, string>(); // column title → column id
    const tagMap = new Map<string, string>(); // tag label → tag id
    let taskCount = 0;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const get = (header: string): string => {
        const idx = headers.indexOf(header);
        return idx >= 0 && idx < row.length ? row[idx].trim() : "";
      };

      const title = get("Title");
      if (!title) continue;

      const task = createTask(title);
      task.sortOrder = taskCount;

      const emoji = get("Emoji");
      if (emoji) task.emoji = emoji;

      const description = get("Description");
      if (description) task.description = description;

      const notes = get("Notes");
      if (notes) {
        task.notes = [{
          id: generateId(),
          createdAt: task.createdAt,
          note: notes,
        }];
      }

      // Dates
      const dueDate = parseTimestamp(get("Due Date"));
      if (dueDate !== null) task.dueDate = dueDate;

      const snoozeUntil = parseTimestamp(get("Snooze Until"));
      if (snoozeUntil !== null) task.snoozeUntil = snoozeUntil;

      const createdAt = parseTimestamp(get("Created At"));
      if (createdAt !== null) task.createdAt = createdAt;

      const updatedAt = parseTimestamp(get("Updated At"));
      if (updatedAt !== null) task.updatedAt = updatedAt;

      const completedAt = parseTimestamp(get("Completed At"));
      if (completedAt !== null) {
        task.completedAt = completedAt;
        task.completed = true;
      }

      const archivedAt = parseTimestamp(get("Archived At"));
      if (archivedAt !== null) {
        task.archivedAt = archivedAt;
        task.archived = true;
      }

      // Status field (overrides timestamp-derived flags if present)
      const status = get("Status").toLowerCase();
      if (status === "completed" && !task.completed) {
        task.completed = true;
        task.completedAt = task.completedAt ?? Date.now();
      } else if (status === "archived" && !task.archived) {
        task.archived = true;
        task.archivedAt = task.archivedAt ?? Date.now();
      }

      // Column
      const columnTitle = get("Column");
      if (columnTitle) {
        if (!columnMap.has(columnTitle)) {
          const col = createColumn(columnTitle);
          col.sortOrder = project.columns.length;
          project.columns.push(col);
          columnMap.set(columnTitle, col.id);
        }
        task.columnId = columnMap.get(columnTitle)!;
      }

      // Tags
      const tagsRaw = get("Tags");
      if (tagsRaw) {
        const labels = tagsRaw.split(",").map((l) => l.trim()).filter(Boolean);
        for (const label of labels) {
          if (!tagMap.has(label)) {
            const color = TAG_COLORS[tagMap.size % TAG_COLORS.length];
            const tag = createTag(label, color);
            project.tags.push(tag);
            tagMap.set(label, tag.id);
          }
          task.tags.push(tagMap.get(label)!);
        }
      }

      project.tasks[task.id] = task;
      taskCount++;
    }

    if (taskCount === 0) {
      return { success: false, error: "CSV file contains no tasks (all rows missing a title)" };
    }

    // Set default column to the first one if columns were created
    if (project.columns.length > 0) {
      project.defaultColumnId = project.columns[0].id;
    }

    const stats: CsvImportStats = {
      totalTasks: taskCount,
      totalColumns: project.columns.length,
      totalTags: project.tags.length,
    };

    return { success: true, project, stats };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to parse CSV file",
    };
  }
}
