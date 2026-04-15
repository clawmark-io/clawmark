import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";

export const Route = createFileRoute("/w/$workspaceId/")({
  component: DefaultViewRedirect,
});

function DefaultViewRedirect() {
  const { workspaceId } = Route.useParams();
  const { workspace } = useWorkspace();

  // Wait for workspace doc to load before deciding where to redirect,
  // so the saved defaultView is used rather than falling back to "projects".
  if (!workspace) {
    return null;
  }

  const defaultView = workspace.defaultView ?? "projects";

  if (defaultView === "upcoming") {
    return (
      <Navigate
        to="/w/$workspaceId/upcoming"
        params={{ workspaceId }}
        replace
      />
    );
  }

  return (
    <Navigate
      to="/w/$workspaceId/projects"
      params={{ workspaceId }}
      replace
    />
  );
}
