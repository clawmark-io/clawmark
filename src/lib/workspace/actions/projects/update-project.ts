import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Project } from "@/types/data-model";

export function updateProject(
  handle: DocHandle<Workspace>,
  projectId: string,
  updates: Partial<Project>,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        delete (project as Record<string, unknown>)[key];
      } else {
        (project as Record<string, unknown>)[key] = value;
      }
    }
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
}
