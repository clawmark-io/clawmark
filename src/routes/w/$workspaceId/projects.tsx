import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/components/home/home-view";
import { useCreateProjectModalState } from "@/stores/create-project";
import { ContentArea } from "@/components/content-area";

export const Route = createFileRoute("/w/$workspaceId/projects")({
  component: ProjectsRoute,
});

function ProjectsRoute() {
  const { showCreateProject } = useCreateProjectModalState();

  return (
    <ContentArea>
      <HomeView onCreateProject={() => showCreateProject()} />
    </ContentArea>
  );
}
