import type { Project, Task, Column, Tag } from "@/types/data-model";
import { getNotes } from "@/lib/utils/notes";

function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function getTaskStatus(task: Task): string {
  if (task.archived) return "Archived";
  if (task.completed) return "Completed";
  return "Active";
}

function formatTimestamp(ts: number | null): string {
  if (ts === null) return "";
  return new Date(ts).toISOString();
}

function findColumnTitle(columns: Column[], columnId: string | null): string {
  if (!columnId) return "";
  const col = columns.find((c) => c.id === columnId);
  return col ? col.title : "";
}

function resolveTagLabels(projectTags: Tag[], taskTagIds: string[]): string {
  return taskTagIds
    .map((id) => {
      const tag = projectTags.find((t) => t.id === id);
      return tag ? tag.label : id;
    })
    .join(", ");
}

const CSV_HEADERS = [
  "Title",
  "Emoji",
  "Description",
  "Status",
  "Column",
  "Due Date",
  "Snooze Until",
  "Tags",
  "Subtasks",
  "Subtasks Completed",
  "Notes",
  "Completed At",
  "Archived At",
  "Created At",
  "Updated At",
];

function taskToCsvRow(task: Task, project: Project): string {
  const subtasksTotal = task.subtasks.length;
  const subtasksCompleted = task.subtasks.filter((s) => s.completed).length;

  const fields = [
    task.title,
    task.emoji ?? "",
    task.description,
    getTaskStatus(task),
    findColumnTitle(project.columns, task.columnId),
    formatTimestamp(task.dueDate),
    formatTimestamp(task.snoozeUntil),
    resolveTagLabels(project.tags, task.tags),
    String(subtasksTotal),
    String(subtasksCompleted),
    getNotes(task.notes).map(n => n.note).join("\n---\n"),
    formatTimestamp(task.completedAt),
    formatTimestamp(task.archivedAt),
    formatTimestamp(task.createdAt),
    formatTimestamp(task.updatedAt),
  ];

  return fields.map(escapeCsvField).join(",");
}

export function buildCsvExport(project: Project): string {
  const tasks = Object.values(project.tasks).toSorted(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const headerRow = CSV_HEADERS.map(escapeCsvField).join(",");
  const dataRows = tasks.map((task) => taskToCsvRow(task, project));
  return [headerRow, ...dataRows].join("\r\n");
}
