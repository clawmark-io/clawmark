import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, Tag } from "@/types/data-model";
import { sanitizeTagLabel } from "@/lib/data-model";

export function updateTag(
  handle: DocHandle<Workspace>,
  projectId: string,
  tagId: string,
  updates: Partial<Tag>,
): void {
  handle.change((doc) => {
    const project = doc.projects[projectId];
    if (!project) return;
    const tag = project.tags.find((t) => t.id === tagId);
    if (!tag) return;
    const sanitized = updates.label !== undefined ? { ...updates, label: sanitizeTagLabel(updates.label) } : updates;
    Object.assign(tag, sanitized);
    const now = Date.now();
    project.updatedAt = now;
    doc.updatedAt = now;
  });
}
