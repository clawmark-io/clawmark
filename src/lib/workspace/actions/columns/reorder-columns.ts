import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function reorderColumns(
  handle: DocHandle<Workspace>,
  projectId: string,
  columnId: string,
  overColumnId: string,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    const columns = [...project.columns].toSorted((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = columns.findIndex((c) => c.id === columnId);
    const newIndex = columns.findIndex((c) => c.id === overColumnId);
    if (oldIndex === -1 || newIndex === -1) return;
    const [moved] = columns.splice(oldIndex, 1);
    columns.splice(newIndex, 0, moved);
    for (let i = 0; i < columns.length; i++) {
      const col = project.columns.find((c) => c.id === columns[i].id);
      if (col) col.sortOrder = i;
    }
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
}
