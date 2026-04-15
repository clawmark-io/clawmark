import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/stores/workspace-context";
import { addTask } from "@/lib/workspace/actions/tasks/add-task";
import { updateTask } from "@/lib/workspace/actions/tasks/update-task";
import type { Tag } from "@/types/data-model";
import { TaskTagInput } from "@/components/ui/task-tag-input";

type TaskAddInputProps = {
  projectId: string;
  projectTags: Tag[];
};

export function TaskAddInput({ projectId, projectTags }: TaskAddInputProps) {
  const { handle } = useWorkspace();
  const { t } = useTranslation("tasks");

  const handleSubmit = (title: string, tagIds: string[]) => {
    if (!handle) return;
    const taskId = addTask(handle, projectId, title);
    if (taskId && tagIds.length > 0) {
      updateTask(handle, projectId, taskId, { tags: tagIds });
    }
  };

  return (
    <TaskTagInput
      projectTags={projectTags}
      placeholder={t("addTaskPlaceholder")}
      onSubmit={handleSubmit}
      formClassName="flex items-center gap-3 py-2.5 px-3.5 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-overlay)] transition-all duration-150 focus-within:border-[var(--border-strong)] focus-within:bg-base-200"
      inputClassName="flex-1 min-w-0 border-none text-inherit text-sm outline-none placeholder:text-[var(--text-placeholder)]"
      icon={<Plus size={16} className="shrink-0 text-[var(--text-placeholder)]" />}
    />
  );
}
