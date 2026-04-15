import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Project, Task } from "@/types/data-model.ts";

const MS_PER_DAY = 86_400_000;

type ArchiveTarget = {
  projectId: string;
  taskIds: string[];
};

function findTargets(doc: Workspace): ArchiveTarget[] {
  const now = Date.now();
  const targets: ArchiveTarget[] = [];

  for (const project of Object.values(doc.projects) as Project[]) {
    if (!project.autoArchive) continue;

    const threshold = now - (project.autoArchiveDays ?? 7) * MS_PER_DAY;
    const taskIds: string[] = [];

    for (const task of Object.values(project.tasks) as Task[]) {
      if (task.completed && !task.archived && task.updatedAt < threshold) {
        taskIds.push(task.id);
      }
    }

    if (taskIds.length > 0) {
      targets.push({ projectId: project.id, taskIds });
    }
  }

  return targets;
}

export function runAutoArchive(handle: DocHandle<Workspace>): void {
  const doc = handle.doc();
  if (!doc) return;

  const targets = findTargets(doc);
  if (targets.length === 0) return;

  handle.change((mutableDoc) => {
    const now = Date.now();
    for (const { projectId, taskIds } of targets) {
      const project = mutableDoc.projects[projectId];
      if (!project) continue;

      for (const taskId of taskIds) {
        const task = project.tasks[taskId];
        if (!task) continue;
        task.archived = true;
        task.updatedAt = now;
      }
    }
  });
}
