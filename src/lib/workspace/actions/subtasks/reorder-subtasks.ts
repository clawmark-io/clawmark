import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function reorderSubtasks(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  subtaskId: string,
  newIndex: number,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    const subtasks = [...task.subtasks].toSorted((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = subtasks.findIndex((s) => s.id === subtaskId);
    if (oldIndex === -1 || newIndex < 0 || newIndex >= subtasks.length) return;
    const [moved] = subtasks.splice(oldIndex, 1);
    subtasks.splice(newIndex, 0, moved);
    for (let i = 0; i < subtasks.length; i++) {
      const subtask = task.subtasks.find((s) => s.id === subtasks[i].id);
      if (subtask) subtask.sortOrder = i;
    }
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
}
