import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function deleteNote(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  noteId: string,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task || !Array.isArray(task.notes)) return;
    const index = task.notes.findIndex((n) => n.id === noteId);
    if (index === -1) return;
    task.notes.splice(index, 1);
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
}
