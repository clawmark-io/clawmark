import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import { useDeleteProjectModalState } from "@/stores/delete-project";
import { ProjectCard } from "./project-card";
import { useGridNavigation } from "@/hooks/useGridNavigation";
import { useEffect } from "react";
import { useCreateProjectModalState } from "@/stores/create-project";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";

type HomeViewProps = {
  onCreateProject: () => void;
};

export function HomeView({ onCreateProject }: HomeViewProps) {
  const { t } = useTranslation("projects");
  const { workspace, workspaceId } = useWorkspace();
  const navigate = useNavigate();
  const { showDeleteProject, visible: deleteProjectVisible } = useDeleteProjectModalState();
  const { visible: createProjectVisible } = useCreateProjectModalState();

  const projects = workspace
    ? Object.values(workspace.projects).toSorted(
        (a, b) => a.sortOrder - b.sortOrder,
      )
    : [];

  const { getContainerProps, getItemProps, focusContainer } = useGridNavigation(
    projects.length,
    {
      wrap: true,
      onActivate: (index) => {
        const project = projects[index];
        if (project) {
          navigate({ to: '/w/$workspaceId/p/$projectId/kanban', params: { workspaceId: workspaceId!, projectId: project.id } });
        }
      },
    }
  );

  // Restore focus when dialogs close
  useEffect(() => {
    if (!createProjectVisible && !deleteProjectVisible) {
      // Small delay to ensure dialog is fully closed
      const timer = setTimeout(() => {
        focusContainer();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [createProjectVisible, deleteProjectVisible, focusContainer]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-subtle)]">
        <h2 className="text-xl font-medium text-base-content">{t("noProjectsYet")}</h2>
        <p className="text-sm">
          {t("createFirstProject")}
        </p>
        <button
          className="btn btn-outline btn-sm gap-2 mt-3"
          onClick={onCreateProject}
        >
          <Plus size={18} />
          {t("newProject")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center gap-2 mb-6">
        <SidebarToggle />
        <h1 className="text-2xl font-semibold">{t("viewTitleProjects", { ns: "common", workspaceName: workspace?.name })}</h1>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 outline-none" {...getContainerProps()}>
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            workspaceId={workspaceId}
            onDelete={() => showDeleteProject(project.id, project.title)}
            {...getItemProps(index, () => navigate({ to: '/w/$workspaceId/p/$projectId/kanban', params: { workspaceId: workspaceId!, projectId: project.id } }))}
          />
        ))}
      </div>
    </div>
  );
}
