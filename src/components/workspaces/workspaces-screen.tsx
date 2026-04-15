import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MoreVertical, Check, Briefcase, Copy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useManager } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import type { WorkspaceListEntry } from "@/lib/workspace/drivers/types";
import { useMenuActionsStore } from "@/stores/menu-actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkspaceWizardDialog } from "./workspace-wizard-dialog";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { RenameWorkspaceDialog } from "./rename-workspace-dialog";
import { CloneWorkspaceDialog } from "./clone-workspace-dialog";
import { APP_NAME, APP_VERSION } from "@/lib/version";
import i18n from "@/i18n";

function formatRelativeTime(timestamp: number): string {
  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;
  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });

  if (absDiff < 60_000) return rtf.format(0, "second");
  if (absDiff < 3_600_000) return rtf.format(sign * Math.round(absDiff / 60_000), "minute");
  if (absDiff < 86_400_000) return rtf.format(sign * Math.round(absDiff / 3_600_000), "hour");
  if (absDiff < 30 * 86_400_000) return rtf.format(sign * Math.round(absDiff / 86_400_000), "day");
  return rtf.format(sign * Math.round(absDiff / (30 * 86_400_000)), "month");
}

function WorkspaceEntry({
  entry,
  isActive,
  onSelect,
  onClone,
  onRename,
  onDelete,
}: {
  entry: WorkspaceListEntry;
  isActive: boolean;
  onSelect: () => void;
  onClone: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("projects");
  const projectCount = entry.projectNames.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={`workspace-entry group ${isActive ? "workspace-entry-active" : ""}`}
    >
      <div className="workspace-entry-icon">
        <Briefcase size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{entry.name}</span>
          {isActive ? <Check size={14} className="text-[var(--accent-purple)] shrink-0" /> : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span>{t("projectCount", { ns: "common", count: projectCount })}</span>
          <span>·</span>
          <span>{formatRelativeTime(entry.lastAccessedAt)}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-overlay)] transition-opacity"
          >
            <MoreVertical size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClone(); }}>
            <Copy size={14} />
            {t("cloneWorkspace")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
            {t("renameButton", { ns: "common" })}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            {t("deleteButton", { ns: "common" })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function WorkspacesScreen() {
  const { t } = useTranslation("projects");
  const navigate = useNavigate();
  const manager = useManager();
  const workspaces = useStore(manager.workspaces);
  const activeWorkspaceId = useStore(manager.activeWorkspaceId);

  const pendingNewWorkspace = useMenuActionsStore((s) => s.pendingNewWorkspace);
  const clearNewWorkspaceRequest = useMenuActionsStore((s) => s.clearNewWorkspaceRequest);

  const hasWorkspaces = workspaces.length > 0;
  const [showWizard, setShowWizard] = useState(!hasWorkspaces);
  const [renameEntry, setRenameEntry] = useState<WorkspaceListEntry | null>(null);
  const [cloneEntry, setCloneEntry] = useState<WorkspaceListEntry | null>(null);

  useEffect(() => {
    if (!hasWorkspaces) setShowWizard(true);
  }, [hasWorkspaces]);

  useEffect(() => {
    if (pendingNewWorkspace) {
      setShowWizard(true);
      clearNewWorkspaceRequest();
    }
  }, [pendingNewWorkspace, clearNewWorkspaceRequest]);
  const [deleteEntry, setDeleteEntry] = useState<WorkspaceListEntry | null>(null);

  const sorted = [...workspaces].toSorted((a, b) => b.lastAccessedAt - a.lastAccessedAt);

  return (
    <div className="workspaces-screen">
      <div className="workspaces-container">
        <h1 className="text-2xl font-bold mb-6">{t("workspaces", { ns: "common" })}</h1>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowWizard(true)}
            className="workspace-entry workspace-add-entry"
          >
            <div className="workspace-entry-icon workspace-add-icon">
              <Plus size={20} />
            </div>
            <span className="font-medium">{t("newWorkspace")}</span>
          </button>

          {sorted.map((entry) => (
            <WorkspaceEntry
              key={entry.workspaceId}
              entry={entry}
              isActive={entry.workspaceId === activeWorkspaceId}
              onSelect={() => navigate({ to: '/w/$workspaceId', params: { workspaceId: entry.workspaceId } })}
              onClone={() => setCloneEntry(entry)}
              onRename={() => setRenameEntry(entry)}
              onDelete={() => setDeleteEntry(entry)}
            />
          ))}
        </div>
      </div>

      <div className="workspaces-version">
        {APP_NAME} v{APP_VERSION}
      </div>

      <WorkspaceWizardDialog
        open={showWizard}
        onOpenChange={setShowWizard}
        forceOpen={!hasWorkspaces}
      />

      {cloneEntry ? (
        <CloneWorkspaceDialog
          open={!!cloneEntry}
          onOpenChange={(open) => { if (!open) setCloneEntry(null); }}
          sourceEntry={cloneEntry}
        />
      ) : null}

      {renameEntry ? (
        <RenameWorkspaceDialog
          open={!!renameEntry}
          onOpenChange={(open) => { if (!open) setRenameEntry(null); }}
          entry={renameEntry}
        />
      ) : null}

      {deleteEntry ? (
        <DeleteWorkspaceDialog
          open={!!deleteEntry}
          onOpenChange={(open) => { if (!open) setDeleteEntry(null); }}
          entry={deleteEntry}
        />
      ) : null}
    </div>
  );
}
