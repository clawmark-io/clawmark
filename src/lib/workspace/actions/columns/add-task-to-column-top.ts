import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";
import { createTask } from "@/lib/data-model";

export function addTaskToColumnTop(
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
    for (const t of columnTasks) {
      project.tasks[t.id].sortOrder = t.sortOrder + 1;
    }
    task.sortOrder = 0;
    project.tasks[task.id] = task;
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
  return task.id;
}
