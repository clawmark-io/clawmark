import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function toggleTaskCompletion(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    const now = Date.now();
    task.completed = !task.completed;
    task.completedAt = task.completed ? now : null;
    task.updatedAt = now;
  });
}
