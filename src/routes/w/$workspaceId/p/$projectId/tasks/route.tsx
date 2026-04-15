import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TasksView } from "@/components/tasks/tasks-view";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/tasks")({
  component: TasksLayout,
});

function TasksLayout() {
  return (
    <>
      <TasksView />
      <Outlet />
    </>
  );
}
