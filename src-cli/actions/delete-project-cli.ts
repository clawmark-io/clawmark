import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function deleteProjectCli(
  handle: DocHandle<Workspace>,
  projectId: string,
): void {
  handle.change((doc) => {
    delete doc.projects[projectId];
    doc.updatedAt = Date.now();
  });
}
