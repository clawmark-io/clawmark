import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";
import { removeImage } from "@/lib/utils/opfs.ts";
import { removePreview } from "@/lib/preview-cache";

export function deleteProject(
  handle: DocHandle<Workspace>,
  workspaceId: string,
  projectId: string,
): void {
  const doc = handle.doc();
  const project = doc?.projects[projectId];
  if (project && doc) {
    const allProjects = Object.values(doc.projects);
    const uuidsToCheck = [project.backgroundVersion, project.logoVersion].filter(Boolean) as string[];
    for (const imgUuid of uuidsToCheck) {
      const stillReferenced = allProjects.some(
        (p) => p.id !== projectId && (p.backgroundVersion === imgUuid || p.logoVersion === imgUuid),
      );
      if (!stillReferenced) {
        removeImage(workspaceId, imgUuid);
      }
    }
    removePreview(workspaceId, projectId);
  }
  handle.change((d) => {
    delete d.projects[projectId];
    d.updatedAt = Date.now();
  });
}
