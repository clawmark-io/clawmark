import { generateId } from "@/lib/utils/id";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, TaskNote } from "@/types/data-model";

export function addNote(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  noteText: string,
): string {
  const noteId = generateId();
  handle.change((doc) => {
    const task = doc.projects[projectId]?.tasks[taskId];
    if (!task) return;
    if (!Array.isArray(task.notes)) {
      (task as any).notes = [];
    }
    const newNote: TaskNote = {
      id: noteId,
      createdAt: Date.now(),
      note: noteText,
    };
    task.notes.push(newNote);
    task.updatedAt = Date.now();
    doc.projects[projectId].updatedAt = Date.now();
  });
  return noteId;
}
