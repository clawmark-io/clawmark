import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, RotateCcw, Archive, Trash2, Palette } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  LargeDialogContent,
} from "@/components/ui/dialog";
import { ColorPicker } from "@/components/ui/color-picker";
import { useWorkspace } from "@/stores/workspace-context";
import { updateTask } from "@/lib/workspace/actions/tasks/update-task";
import { deleteTask } from "@/lib/workspace/actions/tasks/delete-task";
import { toggleTaskCompletion } from "@/lib/workspace/actions/tasks/toggle-task-completion";
import { moveTaskToColumn } from "@/lib/workspace/actions/columns/move-task-to-column";
import { FieldLabel } from "@/components/ui/field-label";
import { TaskDescriptionEditor } from "./task-description-editor";
import { SubtasksSection } from "./subtasks-section";
import { NotesSection } from "./notes-section";
import { DueDateEditor } from "./due-date-editor";
import { SnoozeEditor } from "./snooze-editor";
import { ColumnSelector } from "./column-selector";
import { TaskTagsSection } from "./task-tags-section";
import { TaskEmojisSection } from "./task-emojis-section";


function TaskNotFoundDialog(props: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("tasks");
  return <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("taskNotFound")}</DialogTitle>
      </DialogHeader>
    </DialogContent>
  </Dialog>;
}

function createTimestampFormatter(language: string) {
  return new Intl.DateTimeFormat(language, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(timestamp: number, language: string, t: (key: "justNow") => string): string {
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;
  if (absDiff < 45_000) return t("justNow");
  if (absDiff < 3_600_000) return relativeTimeFormatter.format(sign * Math.round(absDiff / 60_000), "minute");
  if (absDiff < 86_400_000) return relativeTimeFormatter.format(sign * Math.round(absDiff / 3_600_000), "hour");
  if (absDiff < 30 * 86_400_000) return relativeTimeFormatter.format(sign * Math.round(absDiff / 86_400_000), "day");
  if (absDiff < 365 * 86_400_000) return relativeTimeFormatter.format(sign * Math.round(absDiff / (30 * 86_400_000)), "month");
  return relativeTimeFormatter.format(sign * Math.round(absDiff / (365 * 86_400_000)), "year");
}

function TaskTimestamps({ createdAt, updatedAt, completedAt, archivedAt }: {
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  archivedAt: number | null;
}) {
  const { t, i18n } = useTranslation("tasks");
  const timestampFormatter = useMemo(() => createTimestampFormatter(i18n.language), [i18n.language]);

  const entries: { label: string; value: number }[] = [
    { label: t("created"), value: createdAt },
    { label: t("updated"), value: updatedAt },
  ];
  if (completedAt !== null) entries.push({ label: t("completed"), value: completedAt });
  if (archivedAt !== null) entries.push({ label: t("archived"), value: archivedAt });

  return (
    <div className="task-detail-timestamps flex flex-wrap gap-x-5 gap-y-1 py-3 text-xs text-[var(--text-muted)]">
      {entries.map((e) => (
        <span key={e.label} title={timestampFormatter.format(e.value)} className="cursor-default">
          {e.label}: {formatRelativeTime(e.value, i18n.language, t)}
        </span>
      ))}
    </div>
  );
}

function ProjectLink({ projectTitle, onClick }: { projectTitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="text-sm text-[var(--text-muted)] hover:text-[var(--text-subtle)] hover:underline cursor-pointer bg-transparent border-none p-0"
      onClick={onClick}
    >
      {projectTitle}
    </button>
  );
}

function DeleteConfirmDialog({ open, onOpenChange, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("tasks");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("deleteConfirmMessage")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button className="btn btn-outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </button>
          <button className="btn btn-error" onClick={onConfirm}>
            {t("delete")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TaskDetailDialogProps = {
  projectId: string;
  taskId: string;
  open: boolean;
  onClose: () => void;
};

export function TaskDetailDialog({ projectId, taskId, open, onClose }: TaskDetailDialogProps) {
  const { t } = useTranslation("tasks");
  const { workspace, handle } = useWorkspace();
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const params = useParams({ strict: false }) as { projectId?: string };
  const currentProjectId = params.projectId;

  const task = projectId && taskId
    ? workspace?.projects[projectId]?.tasks[taskId]
    : undefined;

  const project = projectId ? workspace?.projects[projectId] : undefined;

  const [localTitle, setLocalTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalTitle(task.title);
    }
  }, [task]);

  useEffect(() => {
    if (!project || !task || !projectId || !taskId) return;
    const projectTagIds = new Set(project.tags.map((tag) => tag.id));
    const cleaned = task.tags.filter((id) => projectTagIds.has(id));
    if (cleaned.length !== task.tags.length) {
      if (handle) updateTask(handle, projectId, taskId, { tags: cleaned });
    }
  }, [project, task, projectId, taskId, handle]);

  if (!task || !projectId || !taskId) {
    return (
      <TaskNotFoundDialog open={open} onOpenChange={() => onClose()}/>
    );
  }

  const handleTitleBlur = () => {
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== task.title) {
      if (handle) updateTask(handle, projectId, taskId, { title: trimmed });
    } else {
      setLocalTitle(task.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setLocalTitle(task.title);
      e.currentTarget.blur();
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    if (handle) deleteTask(handle, projectId, taskId);
    onClose();
  };

  const handleArchive = () => {
    if (handle) updateTask(handle, projectId, taskId, { archived: true });
    onClose();
  };

  const handleColumnChange = (columnId: string) => {
    if (columnId !== task.columnId) {
      if (handle) moveTaskToColumn(handle, projectId, taskId, columnId, 0);
    }
  };

  const handleProjectClick = () => {
    onClose();
    navigate({ to: '/w/$workspaceId/p/$projectId/kanban', params: { workspaceId: workspaceId!, projectId } });
  };

  const showProjectName = project && projectId !== currentProjectId;
  const showColumnSelector = project?.kanbanEnabled && project.columns.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <LargeDialogContent
        className="sm:max-w-[42rem]!"
        onInteractOutside={(e) => {
          const active = document.activeElement as HTMLElement | null;
          if (
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement ||
            active?.isContentEditable
          ) {
            e.preventDefault();
            active.blur();
            requestAnimationFrame(() => onClose());
          }
        }}
      >
        <DialogHeader className="pb-2">
          {showProjectName ? (
            <ProjectLink projectTitle={project.title} onClick={handleProjectClick} />
          ) : null}
          <div className="flex items-center gap-3">
            <DialogTitle className="sr-only">{task.title}</DialogTitle>
            <input
              className={`flex-1 min-w-0 border-0 border-b border-transparent focus:border-[var(--border-default)] bg-transparent text-inherit text-lg font-semibold py-0 outline-none${task.completed ? " line-through opacity-50" : ""}`}
              style={{ overflow: "hidden", textOverflow: "ellipsis" }}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
            />
          </div>
        </DialogHeader>

        <TaskDescriptionEditor
          projectId={projectId}
          taskId={taskId}
          description={task.description}
        />

        <div className="task-detail-fields-row">
          <SnoozeEditor
            snoozeUntil={task.snoozeUntil}
            dueDate={task.dueDate}
            onUpdate={(snoozeUntil) => handle && updateTask(handle, projectId, taskId, { snoozeUntil })}
            className="flex flex-col gap-2 flex-1 min-w-0"
          />
          <DueDateEditor
            dueDate={task.dueDate}
            onUpdate={(dueDate) => handle && updateTask(handle, projectId, taskId, { dueDate })}
            className="flex flex-col gap-2 flex-1 min-w-0"
          />
          {showColumnSelector ? (
            <ColumnSelector
              columns={project.columns}
              currentColumnId={task.columnId}
              onChange={handleColumnChange}
            />
          ) : null}
        </div>

        <TaskEmojisSection
          emoji={task.emoji}
          onUpdate={(emoji) => handle && updateTask(handle, projectId, taskId, { emoji })}
        />

        {project ? (
          <TaskTagsSection
            projectId={projectId}
            projectTags={project.tags}
            taskId={taskId}
            taskTagIds={task.tags}
          />
        ) : null}

        <div className="flex flex-col gap-2 py-3">
          <FieldLabel icon={Palette}>{t("color")}</FieldLabel>
          <ColorPicker
            value={task.color}
            onChange={(color) => handle && updateTask(handle, projectId, taskId, { color })}
          />
        </div>

        <SubtasksSection
          projectId={projectId}
          taskId={taskId}
          subtasks={task.subtasks || []}
        />

        <NotesSection
          projectId={projectId}
          taskId={taskId}
          notes={task.notes}
        />

        <TaskTimestamps
          createdAt={task.createdAt}
          updatedAt={task.updatedAt}
          completedAt={task.completedAt}
          archivedAt={task.archivedAt}
        />

        <div className="task-detail-actions-row flex gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <button
            className="btn btn-outline"
            onClick={() => handle && toggleTaskCompletion(handle, projectId, taskId)}
          >
            {task.completed ? <RotateCcw size={14} /> : <Check size={14} />}
            {task.completed ? t("markIncomplete") : t("markComplete")}
          </button>
          <button className="btn btn-outline" onClick={handleArchive}>
            <Archive size={14} />
            {t("archive")}
          </button>
          <button className="btn btn-error" onClick={handleDeleteClick}>
            <Trash2 size={14} />
            {t("delete")}
          </button>
        </div>
      </LargeDialogContent>
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
      />
    </Dialog>
  );
}
