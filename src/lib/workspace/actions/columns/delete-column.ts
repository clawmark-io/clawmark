import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";

export function deleteColumn(
  handle: DocHandle<Workspace>,
  projectId: string,
  columnId: string,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;

    if (columnId === project.defaultColumnId) {
      return;
    }

    const index = project.columns.findIndex((c) => c.id === columnId);
    if (index === -1) return;
    project.columns.splice(index, 1);
    for (let i = 0; i < project.columns.length; i++) {
      project.columns[i].sortOrder = i;
    }

    const tasks = Object.values(project.tasks) as Task[];
    for (const task of tasks) {
      if (task.columnId === columnId) {
        project.tasks[task.id].columnId = project.defaultColumnId;
      }
    }

    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
}
