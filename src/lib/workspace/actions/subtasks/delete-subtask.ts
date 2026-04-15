import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function deleteSubtask(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  subtaskId: string,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    const index = task.subtasks.findIndex((s) => s.id === subtaskId);
    if (index === -1) return;
    task.subtasks.splice(index, 1);
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
}
