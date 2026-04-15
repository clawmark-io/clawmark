import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function updateWorkspaceName(
  handle: DocHandle<Workspace>,
  name: string,
): void {
  handle.change((doc) => {
    doc.name = name;
    doc.updatedAt = Date.now();
  });
}
