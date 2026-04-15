import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";
import { createProject } from "@/lib/data-model";

export function addProject(
  handle: DocHandle<Workspace>,
  title: string,
): string {
  const project = createProject(title);
  handle.change((doc) => {
    project.sortOrder = Object.keys(doc.projects).length;
    doc.projects[project.id] = project;
    doc.updatedAt = Date.now();
  });
  return project.id;
}
