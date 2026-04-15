import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/stores/workspace-context";
import { spliceTaskDescription } from "@/lib/workspace/actions/tasks/splice-task-description";
import { computeSpliceOps } from "@/lib/automerge/splice-utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

type TaskDescriptionEditorProps = {
  projectId: string;
  taskId: string;
  description: string;
};

export function TaskDescriptionEditor({
  projectId,
  taskId,
  description,
}: TaskDescriptionEditorProps) {
  const { t } = useTranslation("tasks");
  const { handle } = useWorkspace();

  const handleSave = useCallback((newValue: string) => {
    if (!handle) return;
    const { index, deleteCount, insert } = computeSpliceOps(description, newValue);
    spliceTaskDescription(handle, projectId, taskId, index, deleteCount, insert || undefined);
  }, [description, projectId, taskId, handle]);

  return (
    <RichTextEditor
      value={description}
      placeholder={t("descriptionPlaceholder")}
      emptyText={t("addDescription")}
      onSave={handleSave}
    />
  );
}
