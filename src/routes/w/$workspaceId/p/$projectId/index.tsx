import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/")({
  beforeLoad: ({ params }) => {
    // Default to kanban view; the kanban route will redirect to tasks if kanban is disabled
    throw redirect({
      to: "/w/$workspaceId/p/$projectId/kanban",
      params,
    });
  },
});
