import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";

export function updateTask(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  updates: Partial<Task>,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    const now = Date.now();
    if (updates.archived === true && !task.archived) {
      updates = { ...updates, archivedAt: now };
    } else if (updates.archived === false && task.archived) {
      updates = { ...updates, archivedAt: null };
    }
    Object.assign(task, updates, { updatedAt: now });
    doc.projects[projectId].updatedAt = now;
  });
}
