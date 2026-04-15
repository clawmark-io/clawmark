import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function updateNote(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  noteId: string,
  noteText: string,
): void {
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task || !Array.isArray(task.notes)) return;
    const note = task.notes.find((n) => n.id === noteId);
    if (!note) return;
    note.note = noteText;
    note.updatedAt = Date.now();
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
}
