import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/stores/workspace-context";
import { spliceProjectDescription } from "@/lib/workspace/actions/projects/splice-project-description";
import { computeSpliceOps } from "@/lib/automerge/splice-utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

type ProjectBriefEditorProps = {
  projectId: string;
  description: string;
};

export function ProjectBriefEditor({
  projectId,
  description,
}: ProjectBriefEditorProps) {
  const { t } = useTranslation("projects");
  const { handle } = useWorkspace();

  const handleSave = useCallback((newValue: string) => {
    if (!handle) return;
    const { index, deleteCount, insert } = computeSpliceOps(description, newValue);
    spliceProjectDescription(handle, projectId, index, deleteCount, insert || undefined);
  }, [description, projectId, handle]);

  return (
    <RichTextEditor
      value={description}
      emptyText={t("projectBrief") + "..."}
      onSave={handleSave}
    />
  );
}
