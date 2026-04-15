import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useManager } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import { openWorkspaceDoc, cloneWorkspaceProjects, DEFAULT_WORKSPACE_CLONE_OPTIONS } from "@/lib/workspace/workspace-clone.ts";
import type { WorkspaceCloneOptions } from "@/lib/workspace/workspace-clone.ts";
import type { Project } from "@/types/data-model";
import type { WorkspaceListEntry } from "@/lib/workspace/drivers/types";

// --- Step 1: Select source workspace ---

type CloneSelectWorkspaceStepProps = {
  onBack: () => void;
  onSelect: (entry: WorkspaceListEntry) => void;
};

export function CloneSelectWorkspaceStep({ onBack, onSelect }: CloneSelectWorkspaceStepProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");
  const manager = useManager();
  const workspaces = useStore(manager.workspaces);
  const activeWorkspaceId = useStore(manager.activeWorkspaceId);

  // Exclude the currently active workspace — cloning into a new one
  const available = workspaces.filter((w) => w.workspaceId !== activeWorkspaceId);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("cloneSelectWorkspace")}
        </DialogTitle>
        <DialogDescription>{t("cloneSelectWorkspacePrompt")}</DialogDescription>
      </DialogHeader>
      {available.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">{t("noWorkspacesToClone")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {available.map((ws) => (
            <button
              key={ws.workspaceId}
              onClick={() => onSelect(ws)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{ws.name}</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">
                  {tc("projectCount", { count: ws.projectNames.length })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onBack}>{tc("cancelButton")}</button>
      </DialogFooter>
    </>
  );
}

// --- Step 2: Select projects ---

type CloneSelectProjectsStepProps = {
  sourceEntry: WorkspaceListEntry;
  onBack: () => void;
  onNext: (selectedIds: string[]) => void;
};

export function CloneSelectProjectsStep({ sourceEntry, onBack, onNext }: CloneSelectProjectsStepProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const repoShutdownRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { workspace, repo } = await openWorkspaceDoc(
          sourceEntry.workspaceId,
          sourceEntry.databaseName,
        );
        repoShutdownRef.current = () => repo.shutdown();

        if (cancelled) {
          repo.shutdown();
          return;
        }

        // Extract project metadata into plain objects so they survive repo shutdown
        const plainProjects: Record<string, Project> = {};
        for (const [id, project] of Object.entries(workspace.projects)) {
          plainProjects[id] = {
            ...project,
            title: project.title,
            sortOrder: project.sortOrder,
            tasks: project.tasks,
          } as Project;
        }

        // Repo is no longer needed — project list is in plain JS now
        repo.shutdown();
        repoShutdownRef.current = null;

        setProjects(plainProjects);
        setSelectedIds(Object.keys(plainProjects));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to read workspace data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      try { repoShutdownRef.current?.(); } catch { /* ignore */ }
      repoShutdownRef.current = null;
    };
  }, [sourceEntry]);

  const toggleProject = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    const allIds = Object.keys(projects);
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const handleNext = () => {
    onNext(selectedIds);
  };

  const sortedProjects = Object.values(projects).toSorted((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("cloneSelectProjects")}
        </DialogTitle>
        <DialogDescription>{t("cloneSelectProjectsPrompt")}</DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={24} className="animate-spin text-[var(--accent-purple)]" />
          <p className="text-sm text-[var(--text-muted)]">{t("loadingWorkspaces")}</p>
        </div>
      ) : error ? (
        <div className="py-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface-overlay)] transition-colors border-b border-[var(--border-subtle)] mb-1">
            <input
              type="checkbox"
              checked={selectedIds.length === sortedProjects.length}
              onChange={toggleAll}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm font-medium">{tc("selectAll")}</span>
          </label>
          {sortedProjects.map((project) => {
            const taskCount = Object.keys(project.tasks).length;
            return (
              <label
                key={project.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface-overlay)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(project.id)}
                  onChange={() => toggleProject(project.id)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm flex-1">{project.title}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {t("taskCount", { count: taskCount })}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onBack}>{tc("backButton")}</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || !!error || selectedIds.length === 0}
          onClick={handleNext}
        >
          {tc("nextButton")}
        </button>
      </DialogFooter>
    </>
  );
}

// --- Step 3: Configure clone options ---

type CloneConfigureStepProps = {
  sourceEntry: WorkspaceListEntry;
  selectedProjectIds: string[];
  onBack: () => void;
  onDone: () => void;
};

export function CloneConfigureStep({
  sourceEntry,
  selectedProjectIds,
  onBack,
  onDone,
}: CloneConfigureStepProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");
  const [name, setName] = useState(t("wizardCopyNameSuffix", { name: sourceEntry.name }));
  const [options, setOptions] = useState<WorkspaceCloneOptions>({ ...DEFAULT_WORKSPACE_CLONE_OPTIONS });
  const [cloning, setCloning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const manager = useManager();
  const lastUsedTheme = useStore(manager.lastUsedTheme);

  useEffect(() => {
    setTimeout(() => inputRef.current?.select(), 50);
  }, []);

  const handleClone = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || cloning) return;

    setCloning(true);

    try {
      const themeSettings = lastUsedTheme.customColors
        ? { theme: lastUsedTheme.theme, customColors: lastUsedTheme.customColors }
        : { theme: lastUsedTheme.theme };

      const result = await cloneWorkspaceProjects(
        manager,
        sourceEntry.workspaceId,
        sourceEntry.databaseName,
        selectedProjectIds,
        trimmed,
        themeSettings,
        options,
      );

      manager.setActiveWorkspaceId(result.workspaceId);
      onDone();
    } catch {
      // If cloning fails, allow retry
      setCloning(false);
    }
  }, [name, cloning, sourceEntry, selectedProjectIds, options, lastUsedTheme, manager, onDone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleClone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {cloning ? null : (
            <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
              <ArrowLeft size={18} />
            </button>
          )}
          {t("cloneConfigureTitle")}
        </DialogTitle>
        <DialogDescription>{t("cloneConfigurePrompt")}</DialogDescription>
      </DialogHeader>

      {cloning ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
          <p className="text-sm text-[var(--text-muted)]">{t("cloningWorkspace")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("workspaceName")}
            autoFocus
          />
          <div className="flex flex-col gap-2">
            <CloneOptionCheckbox
              label={t("cloneTasksOption")}
              checked={options.cloneTasks}
              onChange={() => setOptions((prev) => ({ ...prev, cloneTasks: !prev.cloneTasks }))}
            />
            <CloneOptionCheckbox
              label={t("cloneCopyImagesOption")}
              checked={options.copyImages}
              onChange={() => setOptions((prev) => ({ ...prev, copyImages: !prev.copyImages }))}
            />
          </div>
          <DialogFooter>
            <button type="button" className="btn btn-outline" onClick={onBack}>{tc("backButton")}</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{t("wizardCloneButton")}</button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}

// --- Shared checkbox component ---

type CloneOptionCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

function CloneOptionCheckbox({ label, checked, onChange }: CloneOptionCheckboxProps) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface-overlay)] transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox checkbox-sm"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
