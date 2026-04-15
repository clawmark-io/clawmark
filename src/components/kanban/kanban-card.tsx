import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import type { Task } from "@/types/data-model";
import { SubtasksBadge } from "@/components/ui/subtasks-badge";
import { DueDateBadge } from "@/components/ui/due-date-badge";
import { SnoozeBadge } from "@/components/ui/snooze-badge";
import { TagBadge } from "@/components/ui/tag-badge";
import { useContrastText } from "@/hooks/use-contrast-text";
import { getBorderColor } from "@/lib/utils/color-contrast.ts";

type KanbanCardProps = {
  task: Task;
  projectId: string;
  columnId: string;
  isOverlay?: boolean;
};

export function KanbanCard({ task, projectId, columnId, isOverlay }: KanbanCardProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams({ strict: false }) as { workspaceId: string };
  const { workspace } = useWorkspace();

  const project = workspace?.projects[projectId];
  const displayMode = project?.dueDateDisplayMode ?? "date";

  const { textClass: cardTextClass } = useContrastText(task.color);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", columnId },
    disabled: isOverlay,
  });

  const style = {
    ...(isOverlay ? {} : {
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    ...(task.color ? { backgroundColor: task.color, borderColor: getBorderColor(task.color) } : {}),
  };

  const handleClick = () => {
    if (!isDragging) {
      navigate({ to: '/w/$workspaceId/p/$projectId/kanban/$taskId', params: { workspaceId, projectId, taskId: task.id } });
    }
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const projectTags = project?.tags ?? [];
  const resolvedTags = task.tags
    .map((id) => projectTags.find((t) => t.id === id))
    .filter((t) => t !== undefined);

  const className = [
    "flex items-start gap-2 py-2 px-2.5 rounded-md bg-[var(--surface-overlay)] border border-[var(--border-subtle)] cursor-pointer transition-all duration-150 hover:border-[var(--border-default)] hover:shadow-[0_1px_3px_var(--shadow-sm)]",
    isDragging ? "opacity-40" : "",
    isOverlay ? "shadow-[0_4px_12px_var(--shadow-md)] border-[var(--border-default)]" : "",
    cardTextClass,
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={className}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className={`leading-[1.4] break-words ${task.completed ? "line-through opacity-50" : ""}`}>
          {task.title}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SubtasksBadge
            completed={completedSubtasks}
            total={totalSubtasks}
            onColor={!!task.color}
          />
          {task.snoozeUntil !== null && task.snoozeUntil > Date.now() ? (
            <SnoozeBadge
              snoozeUntil={task.snoozeUntil}
              displayMode={displayMode}
              onColor={!!task.color}
            />
          ) : null}
          {task.dueDate !== null && (
            <DueDateBadge
              dueDate={task.dueDate}
              displayMode={displayMode}
              completed={task.completed}
              onColor={!!task.color}
            />
          )}
        </div>
        {resolvedTags.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {resolvedTags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} onColor={!!task.color} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
