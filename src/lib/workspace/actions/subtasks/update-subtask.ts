import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Subtask } from "@/types/data-model";

export function updateSubtask(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  subtaskId: string,
  updates: Partial<Subtask>,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;
    Object.assign(subtask, updates);
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
}
