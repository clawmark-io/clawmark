import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Tag } from "@/types/data-model";

export function addTag(
  handle: DocHandle<Workspace>,
  projectId: string,
  tag: Tag,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    project.tags.push(tag);
    const now = Date.now();
    project.updatedAt = now;
    doc.updatedAt = now;
  });
}
