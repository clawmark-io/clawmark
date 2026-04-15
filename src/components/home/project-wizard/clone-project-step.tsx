import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Project } from "@/types/data-model";

type CloneProjectStepProps = {
  projects: Project[];
  onBack: () => void;
  onSelect: (projectId: string) => void;
};

export function CloneProjectStep({ projects, onBack, onSelect }: CloneProjectStepProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("wizardCloneTitle")}
        </DialogTitle>
        <DialogDescription>{t("wizardClonePrompt")}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            onClick={() => onSelect(project.id)}
          />
        ))}
      </div>
      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onBack}>{tc("cancelButton")}</button>
      </DialogFooter>
    </>
  );
}

type ProjectRowProps = {
  project: Project;
  onClick: () => void;
};

function ProjectRow({ project, onClick }: ProjectRowProps) {
  const { t } = useTranslation("projects");
  const taskCount = Object.keys(project.tasks).length;
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] cursor-pointer"
    >
      <span className="text-sm font-medium">{project.title}</span>
      <span className="text-xs text-[var(--text-muted)]">
        {t("taskCount", { count: taskCount })}
      </span>
    </button>
  );
}
