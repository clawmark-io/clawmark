import type { Project, Task, Column } from "@/types/data-model";
import type {
  KanriBoard,
  KanriColumn,
  KanriCard,
  KanriWorkspace,
  KanriColors,
} from "@/types/imports/kanri";
import type { ThemeName } from "@/types/theme";

function exportTask(task: Task): KanriCard {
  return {
    id: task.id,
    name: task.title,
    ...(task.description ? { description: task.description } : {}),
  };
}

function exportColumn(column: Column, tasks: Task[]): KanriColumn {
  const columnTasks = tasks
    .filter((t) => t.columnId === column.id)
    .toSorted((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: column.id,
    title: column.title,
    cards: columnTasks.map(exportTask),
  };
}

export function exportProjectToKanriBoard(project: Project): KanriBoard {
  const tasks = Object.values(project.tasks);
  const sortedColumns = [...project.columns].toSorted(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return {
    id: project.id,
    title: project.title,
    lastEdited: new Date(project.updatedAt).toISOString(),
    columns: sortedColumns.map((col) => exportColumn(col, tasks)),
  };
}

function mapThemeToKanri(theme: ThemeName): string {
  switch (theme) {
    case "light":
    case "alternative-light":
      return "light";
    case "dark":
      return "dark";
    case "darkish":
      return "catppuccin";
    case "custom":
      return "dark";
  }
}

const defaultKanriColors: KanriColors = {
  accent: "#7C3AED",
  accentDarker: "#6D28D9",
  bgPrimary: "#1E1E2E",
  elevation1: "#313244",
  elevation2: "#45475A",
  elevation3: "#585B70",
  text: "#CDD6F4",
  textButtons: "#1E1E2E",
  textD1: "#BAC2DE",
  textD2: "#A6ADC8",
  textD3: "#9399B2",
  textD4: "#7F849C",
};

export function exportProjectsToKanriWorkspace(
  projects: Project[],
  currentTheme: ThemeName,
): KanriWorkspace {
  return {
    activeTheme: mapThemeToKanri(currentTheme),
    boardSortingOption: "default",
    boards: projects.map(exportProjectToKanriBoard),
    colors: defaultKanriColors,
    columnZoomLevel: 100,
    lastInstalledVersion: "0.0.0",
  };
}
