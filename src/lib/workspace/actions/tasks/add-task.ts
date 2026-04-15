import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";
import { createTask } from "@/lib/data-model";

export function addTask(
  handle: DocHandle<Workspace>,
  projectId: string,
  title: string,
): string {
  const task = createTask(title);
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;

    if (!project.defaultColumnId && project.columns.length > 0) {
      const sortedColumns = [...project.columns].toSorted((a, b) => a.sortOrder - b.sortOrder);
      project.defaultColumnId = sortedColumns[0].id;
    }

    if (project.defaultColumnId) {
      task.columnId = project.defaultColumnId;
      const columnTaskCount = (Object.values(project.tasks) as Task[])
        .filter((t) => t.columnId === project.defaultColumnId).length;
      task.sortOrder = columnTaskCount;
    } else {
      task.sortOrder = Object.keys(project.tasks).length;
    }

    project.tasks[task.id] = task;
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
  return task.id;
}
