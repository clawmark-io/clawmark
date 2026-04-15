import { createFileRoute } from "@tanstack/react-router";
import { ProjectSettings } from "@/components/project/project-settings";
import { useWorkspace } from "@/stores/workspace-context";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/settings")({
  component: ProjectSettingsRoute,
});

function ProjectSettingsRoute() {
  const { projectId } = Route.useParams();
  const { workspace } = useWorkspace();
  const project = workspace?.projects[projectId];

  if (!project) return null;

  return <ProjectSettings projectId={projectId} project={project} />;
}
