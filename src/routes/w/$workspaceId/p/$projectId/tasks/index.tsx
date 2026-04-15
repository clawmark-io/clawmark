import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/tasks/")({
  component: () => null,
});
