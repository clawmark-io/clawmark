import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceProvider } from "@/stores/workspace-context";
import { useManager } from "@/stores/manager-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { useCreateProjectModalState } from "@/stores/create-project";
import { useHelpDialogState } from "@/stores/help-dialog";
import { useAboutDialogState } from "@/stores/about-dialog";
import { useSidebarState } from "@/stores/sidebar";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useWorkspace } from "@/stores/workspace-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ProjectWizardDialog } from "@/components/home/project-wizard/project-wizard-dialog";
import { DeleteProjectDialog } from "@/components/home/delete-project-dialog";
import { ColumnSettingsDialog } from "@/components/kanban/column-settings-dialog";
import { HelpDialog } from "@/components/help/help-dialog";
import { AboutDialog } from "@/components/about/about-dialog";

export const Route = createFileRoute("/w/$workspaceId")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { workspaceId } = Route.useParams();
  const manager = useManager();

  return (
    <WorkspaceProvider workspaceId={workspaceId} manager={manager}>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}

function WorkspaceShell() {
  const { showCreateProject } = useCreateProjectModalState();
  const { show: showHelp, hide: hideHelp, isOpen: helpOpen } = useHelpDialogState();
  const { show: showAbout, hide: hideAbout, isOpen: aboutOpen } = useAboutDialogState();
  const { isOpen: sidebarOpen, close: closeSidebar } = useSidebarState();

  useDocumentTitle();
  useWorkspaceKeyboardShortcuts();

  useKeyboardShortcut("F1", () => {
    if (helpOpen) {
      hideHelp();
      showAbout();
    } else {
      showHelp();
    }
  });

  return (
    <div className="flex h-screen w-screen">
      {sidebarOpen ? <div className="sidebar-backdrop" role="presentation" onClick={closeSidebar} /> : null}
      <div className={`sidebar-drawer ${sidebarOpen ? "sidebar-drawer--open" : ""}`}>
        <Sidebar onAddProject={() => showCreateProject()} onHelp={showHelp} />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <Outlet />
      </main>
      <ProjectWizardDialog />
      <DeleteProjectDialog />
      <ColumnSettingsDialog />
      <HelpDialog open={helpOpen} onOpenChange={(open) => (open ? showHelp() : hideHelp())} />
      <AboutDialog open={aboutOpen} onOpenChange={(open) => (open ? showAbout() : hideAbout())} />
    </div>
  );
}

function useWorkspaceKeyboardShortcuts() {
  const { workspaceId } = Route.useParams();
  const navigate = Route.useNavigate();
  const { workspace } = useWorkspace();

  useKeyboardShortcut("`", () => {
    navigate({ to: "/w/$workspaceId/projects", params: { workspaceId } });
  });

  useKeyboardShortcut("u", () => {
    navigate({ to: "/w/$workspaceId/upcoming", params: { workspaceId } });
  });

  // Project view shortcuts - these need the current projectId from URL
  useKeyboardShortcut("1", () => {
    const projectId = getProjectIdFromUrl();
    if (projectId && workspace?.projects[projectId]?.kanbanEnabled) {
      navigate({
        to: "/w/$workspaceId/p/$projectId/kanban",
        params: { workspaceId, projectId },
      });
    }
  });

  useKeyboardShortcut("2", () => {
    const projectId = getProjectIdFromUrl();
    if (projectId) {
      navigate({
        to: "/w/$workspaceId/p/$projectId/tasks",
        params: { workspaceId, projectId },
      });
    }
  });

  useKeyboardShortcut("0", () => {
    const projectId = getProjectIdFromUrl();
    if (projectId) {
      navigate({
        to: "/w/$workspaceId/p/$projectId/settings",
        params: { workspaceId, projectId },
      });
    }
  });

}

function getProjectIdFromUrl(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/\/p\/([^/]+)/);
  return match ? match[1] : null;
}
