import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Task } from "@/types/data-model";

export function reorderTask(
  handle: DocHandle<Workspace>,
  projectId: string,
  taskId: string,
  overTaskId: string,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    const tasks = Object.values(project.tasks) as Task[];
    tasks.sort((a, b) => a.sortOrder - b.sortOrder);

    const oldIndex = tasks.findIndex((t) => t.id === taskId);
    const newIndex = tasks.findIndex((t) => t.id === overTaskId);
    if (oldIndex === -1 || newIndex === -1) return;

    const [moved] = tasks.splice(oldIndex, 1);
    tasks.splice(newIndex, 0, moved);

    for (let i = 0; i < tasks.length; i++) {
      project.tasks[tasks[i].id].sortOrder = i;
    }
    project.updatedAt = Date.now();
  });
}
