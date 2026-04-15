import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/stores/workspace-context";
import { addProject } from "@/lib/workspace/actions/projects/add-project";
import { useCreateProjectModalState } from "@/stores/create-project";
import { createProject } from "@/lib/data-model";
import { applyTemplate } from "@/lib/workspace/project-templates.ts";
import { cloneProject } from "@/lib/workspace/project-clone.ts";
import { processJsonFile } from "@/lib/imports/json-import";
import { processKanriFile } from "@/lib/imports/kanri-import";
import { ChoosePathStep } from "./choose-path-step";
import { CreateNewStep } from "./create-new-step";
import { TemplateStep } from "./template-step";
import { CloneProjectStep } from "./clone-project-step";
import { CloneOptionsStep } from "./clone-options-step";
import { ImportPickProjectStep, ImportInProgressStep, ImportErrorStep } from "./import-step";
import type { WizardStep } from "./types";
import type { ProjectTemplate } from "@/lib/workspace/project-templates.ts";
import type { CloneOptions } from "@/lib/workspace/project-clone.ts";
import type { Project } from "@/types/data-model";
import { importProjects } from '@/lib/workspace/actions/import/import-projects.ts';

export function ProjectWizardDialog() {
  const { hideCreateProject, visible } = useCreateProjectModalState();
  const { workspace, workspaceId, handle } = useWorkspace();
  const navigate = useNavigate();
  const { t } = useTranslation("projects");
  const [step, setStep] = useState<WizardStep>({ type: "choose-path" });

  useEffect(() => {
    if (visible) setStep({ type: "choose-path" });
  }, [visible]);

  const handleClose = () => {
    hideCreateProject();
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) hideCreateProject();
  };

  const navigateAndClose = useCallback((projectId: string) => {
    navigate({ to: '/w/$workspaceId/p/$projectId/kanban', params: { workspaceId: workspaceId!, projectId } });
    hideCreateProject();
  }, [navigate, workspaceId, hideCreateProject]);

  // --- Create new ---
  const handleCreateNew = (name: string) => {
    const projectId = handle ? addProject(handle, name) : "";
    if (projectId) navigateAndClose(projectId);
  };

  // --- Template ---
  const handleCreateFromTemplate = (name: string, template: ProjectTemplate) => {
    let project = createProject(name);
    project = applyTemplate(project, template);
    if (handle) importProjects(handle, [project]);
    navigateAndClose(project.id);
  };

  // --- Clone ---
  const handleClone = async (sourceProjectId: string, name: string, options: CloneOptions) => {
    const source = workspace?.projects[sourceProjectId];
    if (!source) return;
    const cloned = await cloneProject(workspaceId, source, name, options);
    if (handle) importProjects(handle, [cloned]);
    navigateAndClose(cloned.id);
  };

  // --- Import ---
  const triggerImport = useCallback((importType: "json" | "kanri") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    let handled = false;

    input.addEventListener("change", async () => {
      handled = true;
      const file = input.files?.[0];
      if (!file) return;

      setStep({ type: "import-in-progress", importType });

      try {
        const result = importType === "json"
          ? await processJsonFile(workspaceId, file)
          : await processKanriFile(workspaceId, file);

        if (!result.success) {
          setStep({ type: "import-error", importType, error: result.error });
          return;
        }

        const { projects } = result;

        if (projects.length === 0) {
          setStep({ type: "import-error", importType, error: t("wizardNoProjectsInFile") });
          return;
        }

        if (projects.length === 1) {
          if (handle) importProjects(handle, [projects[0]]);
          navigateAndClose(projects[0].id);
        } else {
          setStep({ type: "import-pick-project", importType, projects });
        }
      } catch (err) {
        setStep({
          type: "import-error",
          importType,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    });

    // Detect file picker cancellation
    const handleFocus = () => {
      setTimeout(() => {
        if (!handled && !input.files?.length) {
          // User cancelled — stay on choose-path
        }
        window.removeEventListener("focus", handleFocus);
      }, 300);
    };
    window.addEventListener("focus", handleFocus);

    input.click();
  }, [workspaceId, handle, navigateAndClose, t]);

  const handleImportProject = (project: Project) => {
    if (handle) importProjects(handle, [project]);
    navigateAndClose(project.id);
  };

  // --- Render ---
  const projects = workspace
    ? Object.values(workspace.projects).toSorted((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const renderStep = () => {
    switch (step.type) {
      case "choose-path":
        return (
          <ChoosePathStep
            onCreateNew={() => setStep({ type: "create-new" })}
            onTemplate={() => setStep({ type: "template" })}
            onClone={() => setStep({ type: "clone-pick-source" })}
            onImportJson={() => triggerImport("json")}
            onImportKanri={() => triggerImport("kanri")}
            onCancel={handleClose}
          />
        );

      case "create-new":
        return (
          <CreateNewStep
            onBack={() => setStep({ type: "choose-path" })}
            onCreate={handleCreateNew}
          />
        );

      case "template":
        return (
          <TemplateStep
            onBack={() => setStep({ type: "choose-path" })}
            onCreate={handleCreateFromTemplate}
          />
        );

      case "clone-pick-source":
        return (
          <CloneProjectStep
            projects={projects}
            onBack={() => setStep({ type: "choose-path" })}
            onSelect={(projectId) => setStep({ type: "clone-options", sourceProjectId: projectId })}
          />
        );

      case "clone-options": {
        const sourceProject = workspace?.projects[step.sourceProjectId];
        return (
          <CloneOptionsStep
            sourceProjectTitle={sourceProject?.title ?? ""}
            onBack={() => setStep({ type: "clone-pick-source" })}
            onClone={(name, options) => handleClone(step.sourceProjectId, name, options)}
          />
        );
      }

      case "import-in-progress":
        return <ImportInProgressStep />;

      case "import-pick-project":
        return (
          <ImportPickProjectStep
            importType={step.importType}
            projects={step.projects}
            onBack={() => setStep({ type: "choose-path" })}
            onSelect={handleImportProject}
          />
        );

      case "import-error":
        return (
          <ImportErrorStep
            error={step.error}
            onBack={() => setStep({ type: "choose-path" })}
          />
        );
    }
  };

  const isBusy = step.type === "import-in-progress";

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isBusy}
        onPointerDownOutside={(e) => { if (isBusy) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isBusy) e.preventDefault(); }}
      >
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
