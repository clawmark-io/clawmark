import { generateId } from "@/lib/utils/id";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Subtask } from "@/types/data-model";

export function addSubtask(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  title: string,
): string {
  const subtaskId = generateId();
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    const maxSortOrder = task.subtasks.length > 0
      ? Math.max(...task.subtasks.map((s) => s.sortOrder))
      : -1;
    const newSubtask: Subtask = {
      id: subtaskId,
      title,
      completed: false,
      sortOrder: maxSortOrder + 1,
    };
    task.subtasks.push(newSubtask);
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
  return subtaskId;
}
