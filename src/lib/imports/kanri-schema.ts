import { z } from "zod";

const kanriCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

const kanriColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  cards: z.array(kanriCardSchema),
});

const kanriBackgroundSchema = z.object({
  blur: z.string(),
  brightness: z.string(),
  src: z.string(),
});

const kanriBoardSchema = z.object({
  id: z.string(),
  title: z.string(),
  lastEdited: z.string(),
  columns: z.array(kanriColumnSchema),
  background: kanriBackgroundSchema.optional(),
});

const kanriColorsSchema = z.object({
  accent: z.string(),
  accentDarker: z.string(),
  bgPrimary: z.string(),
  elevation1: z.string(),
  elevation2: z.string(),
  elevation3: z.string(),
  text: z.string(),
  textButtons: z.string(),
  textD1: z.string(),
  textD2: z.string(),
  textD3: z.string(),
  textD4: z.string(),
});

const kanriWorkspaceSchema = z.object({
  activeTheme: z.string(),
  boardSortingOption: z.string(),
  boards: z.array(kanriBoardSchema),
  colors: kanriColorsSchema,
  columnZoomLevel: z.number(),
  lastInstalledVersion: z.string(),
});

export type KanriParseResult =
  | { type: "workspace"; data: z.infer<typeof kanriWorkspaceSchema> }
  | { type: "board"; data: z.infer<typeof kanriBoardSchema> }
  | { type: "error"; message: string };

export function parseKanriExport(raw: unknown): KanriParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { type: "error", message: "Invalid JSON: not an object" };
  }

  const obj = raw as Record<string, unknown>;

  if ("boards" in obj && Array.isArray(obj.boards)) {
    const result = kanriWorkspaceSchema.safeParse(raw);
    if (result.success) return { type: "workspace", data: result.data };
    return { type: "error", message: result.error.message };
  }

  if ("columns" in obj && Array.isArray(obj.columns)) {
    const result = kanriBoardSchema.safeParse(raw);
    if (result.success) return { type: "board", data: result.data };
    return { type: "error", message: result.error.message };
  }

  return {
    type: "error",
    message: "Unrecognized format: expected a Kanri board or workspace export",
  };
}
