import { splice } from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function spliceTaskDescription(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  index: number,
  deleteCount: number,
  insertText?: string,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    splice(doc, ["projects", projectId, "tasks", taskId, "description"], index, deleteCount, insertText);
    task.updatedAt = Date.now();
  });
}
