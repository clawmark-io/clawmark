import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";
import { createColumn } from "@/lib/data-model";

export function addColumn(
  handle: DocHandle<Workspace>,
  projectId: string,
  title: string,
): string {
  const column = createColumn(title);
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    column.sortOrder = project.columns.length;
    project.columns.push(column);
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
  return column.id;
}
