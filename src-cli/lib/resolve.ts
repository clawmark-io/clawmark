import type { Workspace, Project, Tag, Column } from "@/types/data-model";
import type { WorkspaceListItem } from "./server-api";

export function resolveWorkspace(
  workspaces: WorkspaceListItem[],
  nameOrId: string,
): WorkspaceListItem {
  const byId = workspaces.find((w) => w.workspaceId === nameOrId);
  if (byId) return byId;

  const byName = workspaces.filter(
    (w) => w.name.toLowerCase() === nameOrId.toLowerCase(),
  );
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) {
    throw new Error(
      `Ambiguous workspace name "${nameOrId}". Matches: ${byName.map((w) => `${w.name} (${w.workspaceId})`).join(", ")}. Use the workspace ID instead.`,
    );
  }
  throw new Error(`Workspace "${nameOrId}" not found.`);
}

export function resolveProject(doc: Workspace, nameOrId: string): Project {
  const projects = Object.values(doc.projects);

  const byId = projects.find((p) => p.id === nameOrId);
  if (byId) return byId;

  const byTitle = projects.filter(
    (p) => p.title.toLowerCase() === nameOrId.toLowerCase(),
  );
  if (byTitle.length === 1) return byTitle[0];
  if (byTitle.length > 1) {
    throw new Error(
      `Ambiguous project name "${nameOrId}". Matches: ${byTitle.map((p) => `${p.title} (${p.id})`).join(", ")}. Use the project ID instead.`,
    );
  }
  throw new Error(`Project "${nameOrId}" not found.`);
}

export function resolveTag(
  tags: Tag[],
  nameOrId: string,
): Tag {
  const byId = tags.find((t) => t.id === nameOrId);
  if (byId) return byId;

  const byLabel = tags.filter(
    (t) => t.label.toLowerCase() === nameOrId.toLowerCase(),
  );
  if (byLabel.length === 1) return byLabel[0];
  if (byLabel.length > 1) {
    throw new Error(
      `Ambiguous tag name "${nameOrId}". Matches: ${byLabel.map((t) => `${t.label} (${t.id})`).join(", ")}. Use the tag ID instead.`,
    );
  }
  throw new Error(`Tag "${nameOrId}" not found.`);
}

export function resolveColumn(
  columns: Column[],
  nameOrId: string,
): Column {
  const byId = columns.find((c) => c.id === nameOrId);
  if (byId) return byId;

  const byTitle = columns.filter(
    (c) => c.title.toLowerCase() === nameOrId.toLowerCase(),
  );
  if (byTitle.length === 1) return byTitle[0];
  if (byTitle.length > 1) {
    throw new Error(
      `Ambiguous column name "${nameOrId}". Matches: ${byTitle.map((c) => `${c.title} (${c.id})`).join(", ")}. Use the column ID instead.`,
    );
  }
  throw new Error(`Column "${nameOrId}" not found.`);
}

export function resolveTask(
  tasks: Record<string, { id: string; title: string }>,
  nameOrId: string,
): { id: string; title: string } {
  const taskList = Object.values(tasks);

  const byId = taskList.find((t) => t.id === nameOrId);
  if (byId) return byId;

  const byTitle = taskList.filter(
    (t) => t.title.toLowerCase() === nameOrId.toLowerCase(),
  );
  if (byTitle.length === 1) return byTitle[0];
  if (byTitle.length > 1) {
    throw new Error(
      `Ambiguous task name "${nameOrId}". Matches: ${byTitle.map((t) => `${t.title} (${t.id})`).join(", ")}. Use the task ID instead.`,
    );
  }
  throw new Error(`Task "${nameOrId}" not found.`);
}
