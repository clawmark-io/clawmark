import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";

export function mergeTags(
  handle: DocHandle<Workspace>,
  projectId: string,
  sourceTagId: string,
  targetTagId: string,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    const tasks = Object.values(project.tasks) as Task[];
    for (const task of tasks) {
      const sourceIdx = task.tags.indexOf(sourceTagId);
      if (sourceIdx === -1) continue;
      task.tags.splice(sourceIdx, 1);
      if (!task.tags.includes(targetTagId)) {
        task.tags.push(targetTagId);
      }
    }
    const tagIndex = project.tags.findIndex((t) => t.id === sourceTagId);
    if (tagIndex !== -1) project.tags.splice(tagIndex, 1);
    const now = Date.now();
    project.updatedAt = now;
    doc.updatedAt = now;
  });
}
