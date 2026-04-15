import { createFileRoute, Outlet } from "@tanstack/react-router";
import { KanbanView } from "@/components/kanban/kanban-view";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/kanban")({
  component: KanbanLayout,
});

function KanbanLayout() {
  return (
    <>
      <KanbanView />
      <Outlet />
    </>
  );
}
