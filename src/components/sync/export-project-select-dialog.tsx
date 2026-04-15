import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types/data-model";

type ExportProjectSelectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  exportLabel: string;
  projects: Project[];
  defaultProjectId: string | null;
  onExport: (projectId: string) => void;
};

function ProjectRadioItem({
  project,
  selected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation("common");
  const taskCount = Object.keys(project.tasks).length;

  return (
    <label aria-label={project.title} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--surface-overlay)]">
      <input
        type="radio"
        name="export-project"
        checked={selected}
        onChange={onSelect}
        className="radio radio-sm radio-primary"
      />
      <div className="flex flex-col min-w-0">
        <span className="font-medium truncate">{project.title}</span>
        <span className="text-sm text-[var(--text-muted)]">
          {t("taskCount", { count: taskCount })}
        </span>
      </div>
    </label>
  );
}

function EmptyState() {
  const { t } = useTranslation("common");
  return (
    <p className="text-sm text-[var(--text-muted)] py-4 text-center">
      {t("noProjectsAvailable")}
    </p>
  );
}

export function ExportProjectSelectDialog({
  open,
  onOpenChange,
  title,
  description,
  exportLabel,
  projects,
  defaultProjectId,
  onExport,
}: ExportProjectSelectDialogProps) {
  const { t } = useTranslation("common");
  const [selectedId, setSelectedId] = useState<string | null>(defaultProjectId);

  useEffect(() => {
    if (open) {
      setSelectedId(defaultProjectId);
    }
  }, [open, defaultProjectId]);

  const sortedProjects = [...projects].toSorted((a, b) =>
    a.title.localeCompare(b.title),
  );

  const handleExport = () => {
    if (!selectedId) return;
    onExport(selectedId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {sortedProjects.length > 0 ? (
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {sortedProjects.map((project) => (
              <ProjectRadioItem
                key={project.id}
                project={project}
                selected={selectedId === project.id}
                onSelect={() => setSelectedId(project.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        <DialogFooter>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onOpenChange(false)}
          >
            {t("cancelButton")}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!selectedId || projects.length === 0}
            onClick={handleExport}
          >
            {exportLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
