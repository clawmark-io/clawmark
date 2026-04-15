import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import { toggleTaskCompletion } from "@/lib/workspace/actions/tasks/toggle-task-completion";
import type { Task } from "@/types/data-model";
import { useContrastText } from "@/hooks/use-contrast-text";
import { getBorderColor } from "@/lib/utils/color-contrast.ts";
import { TaskRowContent } from "@/components/ui/task-row-content";

type TaskRowProps = {
  task: Task;
  projectId: string;
  dragDisabled?: boolean;
  isOverlay?: boolean;
};

export const TaskRow = memo(function TaskRow({ task, projectId, dragDisabled, isOverlay }: TaskRowProps) {
  const { workspace, handle } = useWorkspace();
  const navigate = useNavigate();
  const { workspaceId } = useParams({ strict: false }) as { workspaceId: string };

  const project = workspace?.projects[projectId];
  const displayMode = project?.dueDateDisplayMode ?? "date";

  const { textClass } = useContrastText(task.color);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: dragDisabled || isOverlay });

  const style = {
    ...(isOverlay ? {} : {
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    ...(task.color ? { backgroundColor: task.color, borderColor: getBorderColor(task.color) } : {}),
  };

  const handleClick = () => {
    if (!isDragging) {
      navigate({ to: '/w/$workspaceId/p/$projectId/tasks/$taskId', params: { workspaceId, projectId, taskId: task.id } });
    }
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handle) toggleTaskCompletion(handle, projectId, task.id);
  };

  const projectTags = project?.tags ?? [];
  const resolvedTags = task.tags
    .map((id) => projectTags.find((t) => t.id === id))
    .filter((t) => t !== undefined);

  const className = [
    "flex items-center gap-3 py-2.5 px-3.5 mb-1.5 rounded-lg bg-base-300 border border-[var(--border-subtle)] cursor-pointer transition-all duration-150 hover:border-[var(--border-default)] hover:shadow-[0_1px_3px_var(--shadow-sm)]",
    isDragging ? "opacity-40" : "",
    isOverlay ? "shadow-[0_4px_12px_var(--shadow-md)] border-[var(--border-default)]" : "",
    textClass,
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      className={className}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
    >
      <div
        role="presentation"
        className="shrink-0 flex items-center cursor-grab touch-none opacity-40 active:cursor-grabbing"
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </div>
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
        <TaskRowContent
          task={task}
          resolvedTags={resolvedTags}
          onCheckboxClick={handleCheckboxChange}
          dueDateDisplayMode={displayMode}
        />
      </div>
    </div>
  );
});
