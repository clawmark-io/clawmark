import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function deleteTask(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    delete project.tasks[taskId];
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
}
