import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/stores/workspace-context";
import { useRouterState } from "@tanstack/react-router";
import { ExportProjectSelectDialog } from "./export-project-select-dialog";
import { ExportProjectsSelectDialog } from "./export-projects-select-dialog";
import {
  exportProjectToKanriBoard,
  exportProjectsToKanriWorkspace,
} from "@/lib/exports/kanri-exporter";
import {
  buildJsonExport,
  buildJsonExportWithImages,
} from "@/lib/exports/json-exporter";
import { buildCsvExport } from "@/lib/exports/csv-exporter";
import { downloadJson, downloadCsv } from "@/lib/exports/download";
import { Checkbox } from "@/components/ui/checkbox";
import type { Project } from "@/types/data-model";

type ExportDialog = "kanri-project" | "kanri-workspace" | "json" | "csv" | null;

type ExportOption = {
  label: string;
  description: string;
  dialog: Exclude<ExportDialog, null>;
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_ ]/g, "").trim() || "export";
}

function ExportOptionRow({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-0.5 items-start px-4 py-3 rounded-lg border border-[var(--border-subtle)] text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] cursor-pointer"
    >
      <span className="font-medium">{label}</span>
      <span className="text-sm text-[var(--text-muted)]">{description}</span>
    </button>
  );
}

export function ExportTabContent() {
  const { t } = useTranslation("sync");
  const { t: tc } = useTranslation("common");
  const [activeDialog, setActiveDialog] = useState<ExportDialog>(null);
  const [exportImages, setExportImages] = useState(false);
  const { workspace, workspaceId } = useWorkspace();
  const routerState = useRouterState();
  const projectMatch = routerState.location.pathname.match(/\/p\/([^/]+)/);
  const currentProjectId = projectMatch ? projectMatch[1] : null;
  const currentTheme = workspace?.theme?.theme ?? "dark";

  const projects: Project[] = workspace
    ? Object.values(workspace.projects)
    : [];

  const options: ExportOption[] = [
    {
      label: t("exportProjectToKanri"),
      description: t("exportProjectToKanriDescription"),
      dialog: "kanri-project",
    },
    {
      label: t("exportWorkspaceToKanri"),
      description: t("exportWorkspaceToKanriDescription"),
      dialog: "kanri-workspace",
    },
    {
      label: t("exportProjectsToJson"),
      description: t("exportProjectsToJsonDescription"),
      dialog: "json",
    },
    {
      label: t("exportTasksToCsv"),
      description: t("exportTasksToCsvDescription"),
      dialog: "csv",
    },
  ];

  const handleKanriProjectExport = (projectId: string) => {
    const project = workspace?.projects[projectId];
    if (!project) return;
    const board = exportProjectToKanriBoard(project);
    downloadJson(`${sanitizeFilename(project.title)}-kanri.json`, board);
  };

  const handleKanriWorkspaceExport = (projectIds: string[]) => {
    if (!workspace) return;
    const selected = projectIds
      .map((id) => workspace.projects[id])
      .filter(Boolean);
    const kanriWorkspace = exportProjectsToKanriWorkspace(
      selected,
      currentTheme,
    );
    downloadJson("workspace-kanri.json", kanriWorkspace);
  };

  const handleJsonExport = async (projectIds: string[]) => {
    if (!workspace) return;
    const selected = projectIds
      .map((id) => workspace.projects[id])
      .filter(Boolean);
    const workspaceMeta = workspace ? { name: workspace.name, theme: workspace.theme, defaultView: workspace.defaultView } : undefined;
    const payload = exportImages
      ? await buildJsonExportWithImages(workspaceId, selected, workspaceMeta)
      : buildJsonExport(selected, workspaceMeta);
    downloadJson("projects-export.json", payload);
  };

  const handleCsvExport = (projectId: string) => {
    const project = workspace?.projects[projectId];
    if (!project) return;
    const csv = buildCsvExport(project);
    downloadCsv(`${sanitizeFilename(project.title)}-tasks.csv`, csv);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <ExportOptionRow
            key={option.label}
            label={option.label}
            description={option.description}
            onClick={() => setActiveDialog(option.dialog)}
          />
        ))}
      </div>

      <ExportProjectSelectDialog
        open={activeDialog === "kanri-project"}
        onOpenChange={(open) => {
          if (!open) setActiveDialog(null);
        }}
        title={t("exportProjectToKanri")}
        description={t("exportProjectToKanriDialogDescription")}
        exportLabel={tc("exportButton")}
        projects={projects}
        defaultProjectId={currentProjectId}
        onExport={handleKanriProjectExport}
      />

      <ExportProjectSelectDialog
        open={activeDialog === "csv"}
        onOpenChange={(open) => {
          if (!open) setActiveDialog(null);
        }}
        title={t("exportTasksToCsv")}
        description={t("exportTasksToCsvDialogDescription")}
        exportLabel={tc("exportButton")}
        projects={projects}
        defaultProjectId={currentProjectId}
        onExport={handleCsvExport}
      />

      <ExportProjectsSelectDialog
        open={activeDialog === "kanri-workspace"}
        onOpenChange={(open) => {
          if (!open) setActiveDialog(null);
        }}
        title={t("exportWorkspaceToKanri")}
        description={t("exportWorkspaceToKanriDialogDescription")}
        exportLabel={tc("exportButton")}
        projects={projects}
        onExport={handleKanriWorkspaceExport}
      />

      <ExportProjectsSelectDialog
        open={activeDialog === "json"}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDialog(null);
            setExportImages(false);
          }
        }}
        title={t("exportProjectsToJson")}
        description={t("exportProjectsToJsonDialogDescription")}
        exportLabel={tc("exportButton")}
        projects={projects}
        onExport={handleJsonExport}
        extraOptions={
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={exportImages}
              onCheckedChange={(val) => setExportImages(val === true)}
            />
            <span className="text-sm">{tc("exportImages")}</span>
          </label>
        }
      />
    </>
  );
}
