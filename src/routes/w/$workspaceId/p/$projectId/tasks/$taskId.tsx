import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskDetailDialog } from "@/components/task-detail/task-detail-dialog";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/tasks/$taskId")({
  component: TasksTaskDetailRoute,
});

function TasksTaskDetailRoute() {
  const { projectId, taskId, workspaceId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <TaskDetailDialog
      projectId={projectId}
      taskId={taskId}
      open={true}
      onClose={() =>
        navigate({
          to: "/w/$workspaceId/p/$projectId/tasks",
          params: { workspaceId, projectId },
        })
      }
    />
  );
}
