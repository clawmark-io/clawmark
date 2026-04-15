import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import { toggleTaskCompletion } from "@/lib/workspace/actions/tasks/toggle-task-completion";
import { useContrastText } from "@/hooks/use-contrast-text";
import { getBorderColor } from "@/lib/utils/color-contrast.ts";
import { TaskRowContent } from "@/components/ui/task-row-content";
import type { UpcomingTask } from "@/lib/upcoming-utils";

type UpcomingTaskRowProps = {
  item: UpcomingTask;
  onClick: () => void;
};

export function UpcomingTaskRow({ item, onClick }: UpcomingTaskRowProps) {
  const { workspace, handle, workspaceId } = useWorkspace();
  const navigate = useNavigate();
  const { task, projectId, projectTitle } = item;
  const { textClass } = useContrastText(task.color);

  const style = task.color
    ? { backgroundColor: task.color, borderColor: getBorderColor(task.color) }
    : {};

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handle) toggleTaskCompletion(handle, projectId, task.id);
  };

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: '/w/$workspaceId/p/$projectId/kanban', params: { workspaceId: workspaceId!, projectId } });
  };

  const projectTags = workspace?.projects[projectId]?.tags ?? [];
  const resolvedTags = task.tags
    .map((id) => projectTags.find((t) => t.id === id))
    .filter((t) => t !== undefined);

  return (
    <div
      style={style}
      role="button"
      tabIndex={0}
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 px-3.5 mb-1.5 rounded-lg bg-base-300 border border-[var(--border-subtle)] cursor-pointer transition-all duration-150 hover:border-[var(--border-default)] hover:shadow-[0_1px_3px_var(--shadow-sm)] ${textClass}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <TaskRowContent
        task={task}
        resolvedTags={resolvedTags}
        onCheckboxClick={handleCheckboxChange}
        project={{ title: projectTitle, onClick: handleProjectClick }}
        dueDateDisplayMode="day"
      />
    </div>
  );
}
