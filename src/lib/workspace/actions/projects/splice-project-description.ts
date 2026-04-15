import { splice } from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function spliceProjectDescription(
  handle: DocHandle<Workspace>,
  projectId: string,
  index: number,
  deleteCount: number,
  insertText?: string,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    splice(doc, ["projects", projectId, "description"], index, deleteCount, insertText);
    project.updatedAt = Date.now();
    doc.updatedAt = Date.now();
  });
}
