import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";
import { createTask } from "@/lib/data-model";

export function addTaskToColumn(
  handle: DocHandle<Workspace>,
  projectId: string,
  title: string,
  columnId: string,
): string {
  const task = createTask(title);
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    task.columnId = columnId;
    const columnTasks = (Object.values(project.tasks) as Task[])
      .filter((t) => t.columnId === columnId);
    const maxSortOrder = columnTasks.reduce((max, t) => Math.max(max, t.sortOrder), -1);
    task.sortOrder = maxSortOrder + 1;
    project.tasks[task.id] = task;
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
  return task.id;
}
