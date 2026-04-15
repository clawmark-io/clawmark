import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/stores/workspace-context";
import { useProjectImages } from "@/hooks/use-project-images";
import { addColumn } from "@/lib/workspace/actions/columns/add-column";
import { ProjectHeader } from "@/components/project/project-header";
import { ContentArea } from "@/components/content-area";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId")({
  component: ProjectLayout,
});

function ProjectBackground({
  backgroundUrl,
  blur,
  sepia,
  grayscale,
  opacity,
}: {
  backgroundUrl: string;
  blur: number;
  sepia: number;
  grayscale: number;
  opacity: number;
}) {
  const hasFilters = blur > 0 || sepia > 0 || grayscale > 0;
  return (
    <>
      <div
        className="project-background-image"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          opacity: opacity / 100,
        }}
      />
      {hasFilters ? (
        <div
          className="project-background-overlay"
          style={{
            backdropFilter: `blur(${blur}px) sepia(${sepia}%) grayscale(${grayscale}%)`,
          }}
        />
      ) : null}
    </>
  );
}

const VIEW_TITLE_KEYS: Record<string, "viewTitleBoard" | "viewTitleTasks" | "viewTitlePreferences"> = {
  kanban: "viewTitleBoard",
  tasks: "viewTitleTasks",
  settings: "viewTitlePreferences",
};

function ProjectLayout() {
  const { t } = useTranslation("common");
  const { projectId, workspaceId } = Route.useParams();
  const { workspace, handle } = useWorkspace();

  const project = workspace?.projects[projectId];
  const { backgroundUrl, logoUrl } = useProjectImages(
    workspaceId,
    projectId,
    project?.backgroundVersion,
    project?.logoVersion,
    workspace?.projects,
  );

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)]">
        <p className="text-sm">Project not found</p>
      </div>
    );
  }

  const currentView = getCurrentProjectView();
  const showBackground = !!backgroundUrl;
  const titleKey = VIEW_TITLE_KEYS[currentView] ?? "viewTitleTasks";
  const headerTitle = t(titleKey, { projectName: project.title });

  const headerActions =
    currentView === "kanban" && handle ? (
      <button className="btn btn-primary btn-sm" onClick={() => addColumn(handle, projectId, "New Column")}>
        <Plus size={16} />
        Add Column
      </button>
    ) : null;

  return (
    <div className="flex flex-col h-full relative">
      {showBackground ? (
        <ProjectBackground
          backgroundUrl={backgroundUrl}
          blur={project.backgroundBlur}
          sepia={project.backgroundSepia ?? 0}
          grayscale={project.backgroundGrayscale ?? 0}
          opacity={project.backgroundOpacity ?? 100}
        />
      ) : null}
      <ContentArea className="relative z-10 h-full">
        <ProjectHeader title={headerTitle} logoUrl={logoUrl} rightContent={headerActions} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </ContentArea>
    </div>
  );
}

function getCurrentProjectView(): string {
  const hash = window.location.hash;
  if (hash.includes("/kanban")) return "kanban";
  if (hash.includes("/tasks")) return "tasks";
  if (hash.includes("/settings")) return "settings";
  return "tasks";
}
