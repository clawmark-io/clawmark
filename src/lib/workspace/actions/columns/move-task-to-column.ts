import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";

export function moveTaskToColumn(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  targetColumnId: string,
  targetIndex: number,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    const task = project.tasks[taskId];
    if (!task) return;
    task.columnId = targetColumnId;
    const columnTasks = (Object.values(project.tasks) as Task[])
      .filter((t) => t.id !== taskId && t.columnId === targetColumnId)
      .toSorted((a, b) => a.sortOrder - b.sortOrder);
    columnTasks.splice(targetIndex, 0, task);
    for (let i = 0; i < columnTasks.length; i++) {
      project.tasks[columnTasks[i].id].sortOrder = i;
    }
    const now = Date.now();
    const targetCol = project.columns.find((c) => c.id === targetColumnId);
    if (targetCol?.autoComplete && !task.completed) {
      task.completed = true;
      task.completedAt = now;
    }
    task.updatedAt = now;
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
}
