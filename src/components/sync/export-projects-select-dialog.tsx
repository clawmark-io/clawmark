import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Project } from "@/types/data-model";

type ExportProjectsSelectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  exportLabel: string;
  projects: Project[];
  onExport: (projectIds: string[]) => void;
  extraOptions?: ReactNode;
};

function ProjectCheckboxItem({
  project,
  checked,
  onCheckedChange,
}: {
  project: Project;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation("common");
  const taskCount = Object.keys(project.tasks).length;

  return (
    <label htmlFor={`export-project-${project.id}`} aria-label={project.title} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--surface-overlay)]">
      <Checkbox
        id={`export-project-${project.id}`}
        checked={checked}
        onCheckedChange={(val) => onCheckedChange(val === true)}
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

function SelectAllControl({
  allSelected,
  onToggle,
}: {
  allSelected: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation("common");
  return (
    <button
      type="button"
      className="text-xs text-[var(--accent-purple)] hover:text-[var(--accent-purple-hover)] cursor-pointer transition-colors"
      onClick={onToggle}
    >
      {t(allSelected ? "unselectAll" : "selectAll")}
    </button>
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

export function ExportProjectsSelectDialog({
  open,
  onOpenChange,
  title,
  description,
  exportLabel,
  projects,
  onExport,
  extraOptions,
}: ExportProjectsSelectDialogProps) {
  const { t } = useTranslation("common");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(projects.map((p) => p.id)),
  );

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  }, [open, projects]);

  const sortedProjects = [...projects].toSorted((a, b) =>
    a.title.localeCompare(b.title),
  );

  const allSelected = selectedIds.size === projects.length && projects.length > 0;

  const toggleProject = (projectId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(projectId);
      } else {
        next.delete(projectId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  };

  const handleExport = () => {
    if (selectedIds.size === 0) return;
    onExport(Array.from(selectedIds));
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
          <>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {sortedProjects.map((project) => (
                <ProjectCheckboxItem
                  key={project.id}
                  project={project}
                  checked={selectedIds.has(project.id)}
                  onCheckedChange={(checked) =>
                    toggleProject(project.id, checked)
                  }
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <SelectAllControl
                allSelected={allSelected}
                onToggle={toggleAll}
              />
              <span className="text-sm text-[var(--text-muted)]">
                {t("selectedOfTotal", { selected: selectedIds.size, total: projects.length })}
              </span>
            </div>
          </>
        ) : (
          <EmptyState />
        )}

        {extraOptions ? extraOptions : null}

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
            disabled={selectedIds.size === 0}
            onClick={handleExport}
          >
            {exportLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
