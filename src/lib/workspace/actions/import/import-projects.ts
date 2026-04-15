import type { DocHandle } from '@automerge/automerge-repo';
import type { Project, Workspace } from '@/types/data-model.ts';

export function importProjects(
  handle: DocHandle<Workspace>,
  projects: Project[],
): void {
  handle.change((doc) => {
    const existingCount = Object.keys(doc.projects).length;
    projects.forEach((project, index) => {
      project.sortOrder = existingCount + index;
      doc.projects[project.id] = project;
    });
    doc.updatedAt = Date.now();
  });
}