import { generateId } from "@/lib/utils/id";
import type { Project, Column, Task } from "@/types/data-model";
import type { ThemeName } from "@/stores/theme-store";
import type { KanriParseResult } from "./kanri-schema";

export type ImportedProject = {
  project: Project;
  backgroundSrc: string | null;
};

export type ConversionResult = {
  imported: ImportedProject[];
  suggestedTheme: ThemeName | null;
  stats: ImportStats;
};

export type ImportStats = {
  type: "board" | "workspace";
  projectCount: number;
  totalTasks: number;
  totalColumns: number;
  backgroundsFound: number;
  backgroundsImported: number;
};

function mapKanriTheme(kanriTheme: string): ThemeName {
  switch (kanriTheme) {
    case "light":
      return "light";
    case "dark":
      return "dark";
    case "catppuccin":
      return "darkish";
    default:
      return "darkish";
  }
}

function parseBlurValue(blur: string): number {
  const match = blur.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function convertBoard(board: {
  id: string;
  title: string;
  columns: { id: string; title: string; cards: { id: string; name: string; description?: string }[] }[];
  background?: { blur: string; brightness: string; src: string };
}): ImportedProject {
  const now = Date.now();

  const columns: Column[] = board.columns.map((col, index) => ({
    id: generateId(),
    title: col.title,
    color: null,
    backgroundColor: null,
    sortOrder: index,
    autoComplete: false,
    taskLimit: null,
    hiddenOnKanban: false,
  }));

  const columnIdMap = new Map<string, string>();
  board.columns.forEach((col, index) => {
    columnIdMap.set(col.id, columns[index].id);
  });

  const tasks: Record<string, Task> = {};

  for (const kanriCol of board.columns) {
    const newColumnId = columnIdMap.get(kanriCol.id)!;
    kanriCol.cards.forEach((card, cardIndex) => {
      const taskId = generateId();
      tasks[taskId] = {
        id: taskId,
        title: card.name,
        emoji: null,
        description: card.description ?? "",
        color: null,
        columnId: newColumnId,
        sortOrder: cardIndex,
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
    });
  }

  const backgroundSrc = board.background?.src ?? null;

  const project: Project = {
    id: generateId(),
    kanbanEnabled: true,
    title: board.title,
    description: "",
    backgroundBlur: board.background ? parseBlurValue(board.background.blur) : 0,
    backgroundSepia: 0,
    backgroundGrayscale: 0,
    backgroundOpacity: 100,
    defaultTaskColors: [],
    customTaskColors: [],
    tags: [],
    columns,
    defaultColumnId: columns.length > 0 ? columns[0].id : null,
    newTaskInputOnTop: false,
    tasks,
    dueDateDisplayMode: "date",
    autoArchive: false,
    autoArchiveDays: 7,
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
  };

  return { project, backgroundSrc };
}

export function convertKanriExport(parsed: Exclude<KanriParseResult, { type: "error" }>): ConversionResult {
  if (parsed.type === "board") {
    const imported = [convertBoard(parsed.data)];
    return {
      imported,
      suggestedTheme: null,
      stats: {
        type: "board",
        projectCount: 1,
        totalTasks: Object.keys(imported[0].project.tasks).length,
        totalColumns: imported[0].project.columns.length,
        backgroundsFound: imported[0].backgroundSrc ? 1 : 0,
        backgroundsImported: 0,
      },
    };
  }

  const imported = parsed.data.boards.map(convertBoard);
  const totalTasks = imported.reduce((sum, i) => sum + Object.keys(i.project.tasks).length, 0);
  const totalColumns = imported.reduce((sum, i) => sum + i.project.columns.length, 0);
  const backgroundsFound = imported.filter((i) => i.backgroundSrc !== null).length;

  return {
    imported,
    suggestedTheme: mapKanriTheme(parsed.data.activeTheme),
    stats: {
      type: "workspace",
      projectCount: imported.length,
      totalTasks,
      totalColumns,
      backgroundsFound,
      backgroundsImported: 0,
    },
  };
}
