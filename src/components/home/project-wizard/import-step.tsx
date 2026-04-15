import { useState } from "react";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Project } from "@/types/data-model";

type ImportPickProjectStepProps = {
  importType: "json" | "kanri";
  projects: Project[];
  onBack: () => void;
  onSelect: (project: Project) => void;
};

export function ImportPickProjectStep({ importType, projects, onBack, onSelect }: ImportPickProjectStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");
  const format = importType === "json" ? "JSON" : "Kanri";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("wizardImportFrom", { format })}
        </DialogTitle>
        <DialogDescription>{t("wizardImportPickPrompt")}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {projects.map((project) => {
          const taskCount = Object.keys(project.tasks).length;
          const isSelected = selectedId === project.id;
          return (
            <button
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                isSelected
                  ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]/10"
                  : "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)]"
              }`}
            >
              <span className="text-sm font-medium">{project.title}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {t("taskCount", { count: taskCount })}
              </span>
            </button>
          );
        })}
      </div>
      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onBack}>{tc("cancelButton")}</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selectedId}
          onClick={() => {
            const project = projects.find((p) => p.id === selectedId);
            if (project) onSelect(project);
          }}
        >
          {tc("importButton")}
        </button>
      </DialogFooter>
    </>
  );
}

export function ImportInProgressStep() {
  const { t } = useTranslation("projects");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("importing")}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
        <p className="text-sm text-[var(--text-muted)]">{t("wizardImportingProject")}</p>
      </div>
    </>
  );
}

type ImportErrorStepProps = {
  error: string;
  onBack: () => void;
};

export function ImportErrorStep({ error, onBack }: ImportErrorStepProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("importError")}
        </DialogTitle>
      </DialogHeader>
      <div className="flex items-center gap-2 py-4">
        <XCircle size={18} className="text-error shrink-0" />
        <p className="text-sm text-error break-words">{error}</p>
      </div>
      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onBack}>{tc("backButton")}</button>
      </DialogFooter>
    </>
  );
}
