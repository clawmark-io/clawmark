import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function toggleSubtaskCompletion(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  subtaskId: string,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;
    subtask.completed = !subtask.completed;
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
}
