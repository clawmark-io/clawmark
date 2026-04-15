import type { ReactNode } from "react";
import type { ImportStats } from "@/lib/imports/kanri-converter";
import type { JsonImportStats } from "@/lib/imports/json-import";
import type { CsvImportStats } from "@/lib/imports/csv-import";

export function renderKanriImportSummary(stats: ImportStats): ReactNode {
  const skipped = stats.backgroundsFound - stats.backgroundsImported;

  return (
    <ul className="list-disc pl-5 space-y-1">
      <li>
        {stats.projectCount} {stats.projectCount === 1 ? "project" : "projects"} imported
        {stats.type === "workspace" ? " (workspace)" : " (single board)"}
      </li>
      <li>{stats.totalTasks} {stats.totalTasks === 1 ? "task" : "tasks"} imported</li>
      <li>{stats.totalColumns} {stats.totalColumns === 1 ? "column" : "columns"} created</li>
      {stats.backgroundsImported > 0 ? (
        <li>{stats.backgroundsImported} {stats.backgroundsImported === 1 ? "background" : "backgrounds"} imported</li>
      ) : null}
      {skipped > 0 ? (
        <li className="text-[var(--text-muted)]">
          {skipped} {skipped === 1 ? "background" : "backgrounds"} skipped (local file paths not accessible)
        </li>
      ) : null}
    </ul>
  );
}

export function renderJsonImportSummary(stats: JsonImportStats): ReactNode {
  return (
    <ul className="list-disc pl-5 space-y-1">
      <li>
        {stats.projectCount} {stats.projectCount === 1 ? "project" : "projects"} imported
      </li>
      <li>{stats.totalTasks} {stats.totalTasks === 1 ? "task" : "tasks"} imported</li>
      <li>{stats.totalColumns} {stats.totalColumns === 1 ? "column" : "columns"} created</li>
      {stats.logosImported > 0 ? (
        <li>{stats.logosImported} {stats.logosImported === 1 ? "logo" : "logos"} imported</li>
      ) : null}
      {stats.backgroundsImported > 0 ? (
        <li>{stats.backgroundsImported} {stats.backgroundsImported === 1 ? "background" : "backgrounds"} imported</li>
      ) : null}
    </ul>
  );
}

export function renderCsvImportSummary(stats: CsvImportStats): ReactNode {
  return (
    <ul className="list-disc pl-5 space-y-1">
      <li>{stats.totalTasks} {stats.totalTasks === 1 ? "task" : "tasks"} imported</li>
      {stats.totalColumns > 0 ? (
        <li>{stats.totalColumns} {stats.totalColumns === 1 ? "column" : "columns"} created</li>
      ) : null}
      {stats.totalTags > 0 ? (
        <li>{stats.totalTags} {stats.totalTags === 1 ? "tag" : "tags"} created</li>
      ) : null}
    </ul>
  );
}
