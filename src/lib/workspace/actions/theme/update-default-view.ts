import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, WorkspaceDefaultView } from "@/types/data-model";

export function updateDefaultView(
  handle: DocHandle<Workspace>,
  defaultView: WorkspaceDefaultView,
): void {
  handle.change((doc) => {
    doc.defaultView = defaultView;
    doc.updatedAt = Date.now();
  });
}
