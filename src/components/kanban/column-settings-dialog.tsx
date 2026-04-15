import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { useColumnSettingsState } from "@/stores/column-settings";
import { useWorkspace } from "@/stores/workspace-context";
import { updateColumn } from "@/lib/workspace/actions/columns/update-column";
import { deleteColumn } from "@/lib/workspace/actions/columns/delete-column";
import { FieldLabel } from "@/components/ui/field-label";
import type { Column } from "@/types/data-model";

export function ColumnSettingsDialog() {
  const { visible, projectId, columnId, hideColumnSettings } = useColumnSettingsState();
  const { workspace, handle } = useWorkspace();
  const { t } = useTranslation("tasks");

  const project = projectId ? workspace?.projects[projectId] : undefined;
  const column = project?.columns.find((c) => c.id === columnId);
  const isDefaultColumn = project?.defaultColumnId === columnId;

  const [localTitle, setLocalTitle] = useState("");
  const [localTaskLimit, setLocalTaskLimit] = useState<string>("");

  useEffect(() => {
    if (column) {
      setLocalTitle(column.title);
      setLocalTaskLimit(column.taskLimit !== null ? String(column.taskLimit) : "");
    }
  }, [column]);

  const update = useCallback((updates: Partial<Column>) => {
    if (!projectId || !columnId || !handle) return;
    updateColumn(handle, projectId, columnId, updates);
  }, [projectId, columnId, handle]);

  const handleTitleBlur = () => {
    const trimmed = localTitle.trim() || t("untitled");
    if (trimmed !== column?.title) {
      update({ title: trimmed });
    } else {
      setLocalTitle(column?.title ?? "");
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setLocalTitle(column?.title ?? "");
      e.currentTarget.blur();
    }
  };

  const handleTaskLimitBlur = () => {
    const parsed = localTaskLimit ? parseInt(localTaskLimit) : null;
    const next = parsed !== null && parsed >= 1 ? parsed : null;
    if (next !== column?.taskLimit) {
      update({ taskLimit: next });
    }
    setLocalTaskLimit(next !== null ? String(next) : "");
  };

  const handleTaskLimitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setLocalTaskLimit(column?.taskLimit !== null && column?.taskLimit !== undefined ? String(column.taskLimit) : "");
      e.currentTarget.blur();
    }
  };

  const handleDelete = () => {
    if (!projectId || !columnId) return;
    if (handle) deleteColumn(handle, projectId, columnId);
    hideColumnSettings();
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => { if (!open) hideColumnSettings(); }}>
      <DialogContent
        onInteractOutside={(e) => {
          const active = document.activeElement as HTMLElement | null;
          if (
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement
          ) {
            e.preventDefault();
            active.blur();
            requestAnimationFrame(() => hideColumnSettings());
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("columnSettings")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("title")}</FieldLabel>
            <input
              className="input input-bordered input-sm bg-[var(--surface-overlay)]"
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("color")}</FieldLabel>
            <ColorPicker value={column?.color ?? null} onChange={(color) => update({ color })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("backgroundColor")}</FieldLabel>
            <ColorPicker value={column?.backgroundColor ?? null} onChange={(backgroundColor) => update({ backgroundColor })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("taskLimitSoft")}</FieldLabel>
            <input
              className="input input-bordered input-sm bg-[var(--surface-overlay)]"
              type="number"
              min={1}
              placeholder={t("noLimit")}
              value={localTaskLimit}
              onChange={(e) => setLocalTaskLimit(e.target.value)}
              onBlur={handleTaskLimitBlur}
              onKeyDown={handleTaskLimitKeyDown}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={column?.autoComplete ?? false}
              onCheckedChange={(autoComplete) => update({ autoComplete })}
            />
            <span className="text-sm">{t("autoCompleteTasks")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={column?.hiddenOnKanban ?? false}
              onCheckedChange={(hiddenOnKanban) => update({ hiddenOnKanban })}
            />
            <span className="text-sm">{t("hiddenOnKanban")}</span>
          </div>

          {!isDefaultColumn ? (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <button className="btn btn-error" onClick={handleDelete}>
                {t("deleteColumn")}
              </button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
