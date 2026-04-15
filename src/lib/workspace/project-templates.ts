import { createColumn, createTag } from "@/lib/data-model.ts";
import type { Project } from "@/types/data-model.ts";

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  columns: Array<{ title: string; autoComplete?: boolean; hiddenOnKanban?: boolean }>;
  tags: Array<{ label: string; color: string }>;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "simple-kanban",
    name: "Simple Kanban",
    description: "Three columns: To Do, In Progress, Done",
    columns: [
      { title: "To Do" },
      { title: "In Progress" },
      { title: "Done", autoComplete: true },
    ],
    tags: [],
  },
  {
    id: "sdlc-kanban",
    name: "SDLC Kanban",
    description: "Software development lifecycle with columns and tags",
    columns: [
      { title: "Backlog", hiddenOnKanban: true },
      { title: "To Do" },
      { title: "In Development" },
      { title: "Code Review" },
      { title: "QA" },
      { title: "Done", autoComplete: true },
    ],
    tags: [
      { label: "bug", color: "#ef4444" },
      { label: "feature", color: "#3b82f6" },
      { label: "improvement", color: "#22c55e" },
      { label: "tech-debt", color: "#f97316" },
      { label: "documentation", color: "#a855f7" },
    ],
  },
];

export function applyTemplate(project: Project, template: ProjectTemplate): Project {
  const columns = template.columns.map((col, index) => {
    const column = createColumn(col.title);
    column.sortOrder = index;
    if (col.autoComplete) column.autoComplete = true;
    if (col.hiddenOnKanban) column.hiddenOnKanban = true;
    return column;
  });

  const tags = template.tags.map((t) => createTag(t.label, t.color));

  return {
    ...project,
    columns,
    defaultColumnId: columns[0]?.id ?? null,
    tags,
    kanbanEnabled: true,
  };
}
