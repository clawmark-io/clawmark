import { TaskCheckbox } from "@/components/ui/task-checkbox";
import { SubtasksBadge } from "@/components/ui/subtasks-badge";
import { DueDateBadge } from "@/components/ui/due-date-badge";
import { SnoozeBadge } from "@/components/ui/snooze-badge";
import { TagBadge } from "@/components/ui/tag-badge";
import type { Task, Tag, DueDateDisplayMode } from "@/types/data-model";

type TaskRowContentProps = {
  task: Task;
  resolvedTags: Tag[];
  onCheckboxClick: (e: React.MouseEvent) => void;
  project?: { title: string; onClick: (e: React.MouseEvent) => void };
  dueDateDisplayMode: DueDateDisplayMode;
};

export function TaskRowContent({
  task,
  resolvedTags,
  onCheckboxClick,
  project,
  dueDateDisplayMode,
}: TaskRowContentProps) {
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const isSnoozed = task.snoozeUntil !== null && task.snoozeUntil > Date.now();
  const hasColor = !!task.color;

  return (
    <>
      <div role="button" tabIndex={0} className="shrink-0 flex items-center" onClick={onCheckboxClick} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCheckboxClick(e as unknown as React.MouseEvent); } }}>
        <TaskCheckbox checked={task.completed} onColor={hasColor} taskColor={task.color} />
      </div>
      <span
        className={`min-w-0 truncate flex-[999_1_0] sm:min-w-[200px] ${task.completed ? "line-through opacity-50" : ""}`}
      >
        {task.title}
      </span>
      <div className="flex items-center gap-2 flex-wrap basis-full sm:flex-[1_1_auto] order-last sm:order-none justify-end">
        {resolvedTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onColor={hasColor} />
        ))}
        {project !== undefined ? (
          <span
            role="button"
            tabIndex={0}
            className="badge badge-sm bg-[var(--surface-overlay-hover)] text-[var(--text-subtle)] border-transparent cursor-pointer hover:underline"
            onClick={project.onClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); project.onClick(e as unknown as React.MouseEvent); } }}
          >
            {project.title}
          </span>
        ) : null}
        <SubtasksBadge
          completed={completedSubtasks}
          total={totalSubtasks}
          onColor={hasColor}
        />
        {isSnoozed ? (
          <SnoozeBadge
            snoozeUntil={task.snoozeUntil!}
            displayMode={dueDateDisplayMode}
            onColor={hasColor}
          />
        ) : null}
        {task.dueDate !== null ? (
          <DueDateBadge
            dueDate={task.dueDate}
            displayMode={dueDateDisplayMode}
            completed={task.completed}
            onColor={hasColor}
          />
        ) : null}
      </div>
    </>
  );
}
