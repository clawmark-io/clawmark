import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Column } from "@/types/data-model";

export function updateColumn(
  handle: DocHandle<Workspace>,
  projectId: string,
  columnId: string,
  updates: Partial<Column>,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    const column = project.columns.find((c) => c.id === columnId);
    if (!column) return;
    Object.assign(column, updates);
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
}
