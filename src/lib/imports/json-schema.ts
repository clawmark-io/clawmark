import { z } from "zod";

const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  sortOrder: z.number(),
});

const taskNoteSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  note: z.string(),
});

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  emoji: z.string().nullable(),
  description: z.string(),
  color: z.string().nullable(),
  columnId: z.string().nullable(),
  sortOrder: z.number(),
  completed: z.boolean(),
  archived: z.boolean(),
  dueDate: z.number().nullable(),
  snoozeUntil: z.number().nullable().optional().default(null),
  tags: z.array(z.string()),
  subtasks: z.array(subtaskSchema),
  notes: z.union([z.string(), z.array(taskNoteSchema)]).transform(v =>
    typeof v === "string" ? [] : v
  ),
  completedAt: z.number().nullable().optional().default(null),
  archivedAt: z.number().nullable().optional().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const tagSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
});

const columnSchema = z.object({
  id: z.string(),
  title: z.string(),
  color: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  sortOrder: z.number(),
  autoComplete: z.boolean(),
  taskLimit: z.number().nullable(),
  hiddenOnKanban: z.boolean().optional().default(false),
});

const projectSchema = z.object({
  id: z.string(),
  kanbanEnabled: z.boolean(),
  title: z.string(),
  description: z.string(),
  hasLogo: z.boolean().optional(),
  hasBackground: z.boolean().optional(),
  backgroundVersion: z.string().optional(),
  backgroundMimeType: z.string().optional(),
  logoVersion: z.string().optional(),
  logoMimeType: z.string().optional(),
  backgroundBlur: z.number(),
  backgroundSepia: z.number(),
  backgroundGrayscale: z.number(),
  backgroundOpacity: z.number(),
  defaultTaskColors: z.array(z.string()),
  customTaskColors: z.array(z.string()),
  tags: z.array(tagSchema),
  columns: z.array(columnSchema),
  defaultColumnId: z.string().nullable(),
  newTaskInputOnTop: z.boolean().optional().default(false),
  tasks: z.record(z.string(), taskSchema),
  dueDateDisplayMode: z.enum(["date", "day", "time"]),
  autoArchive: z.boolean(),
  autoArchiveDays: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  sortOrder: z.number(),
});

const projectImagesSchema = z.object({
  logo: z.string().nullable(),
  background: z.string().nullable(),
});

const themeSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "darkish", "alternative-light", "custom"]),
  customColors: z.record(z.string(), z.string()).optional(),
});

const workspaceMetaSchema = z.object({
  name: z.string(),
  theme: themeSettingsSchema,
  defaultView: z.enum(["projects", "upcoming"]).optional(),
});

const jsonExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  projects: z.array(projectSchema),
  images: z.record(z.string(), projectImagesSchema).optional(),
  workspace: workspaceMetaSchema.optional(),
});

export type JsonExportData = z.infer<typeof jsonExportSchema>;

export type JsonParseResult =
  | { type: "success"; data: JsonExportData }
  | { type: "error"; message: string };

export function parseJsonExport(raw: unknown): JsonParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { type: "error", message: "Invalid JSON: not an object" };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.version !== 1 || !Array.isArray(obj.projects)) {
    return {
      type: "error",
      message: "Unrecognized format: expected a Tasks JSON export with version 1",
    };
  }

  const result = jsonExportSchema.safeParse(raw);
  if (result.success) return { type: "success", data: result.data };
  return { type: "error", message: result.error.message };
}
