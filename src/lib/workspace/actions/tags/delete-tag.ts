import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";

export function deleteTag(
  handle: DocHandle<Workspace>,
  projectId: string,
  tagId: string,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    const tagIndex = project.tags.findIndex((t) => t.id === tagId);
    if (tagIndex !== -1) project.tags.splice(tagIndex, 1);
    const tasks = Object.values(project.tasks) as Task[];
    for (const task of tasks) {
      const idx = task.tags.indexOf(tagId);
      if (idx !== -1) task.tags.splice(idx, 1);
    }
    const now = Date.now();
    project.updatedAt = now;
    doc.updatedAt = now;
  });
}
