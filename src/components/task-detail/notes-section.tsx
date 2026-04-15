import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Plus } from "lucide-react";
import Markdown from "react-markdown";
import { useWorkspace } from "@/stores/workspace-context";
import { addNote } from "@/lib/workspace/actions/notes/add-note";
import { updateNote } from "@/lib/workspace/actions/notes/update-note";
import { deleteNote } from "@/lib/workspace/actions/notes/delete-note";
import { getNotes } from "@/lib/utils/notes";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { TaskNote } from "@/types/data-model";

function formatNoteTime(timestamp: number, language: string): string {
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;
  if (absDiff < 60_000) return formatter.format(sign * Math.round(absDiff / 1000), "second");
  if (absDiff < 3_600_000) return formatter.format(sign * Math.round(absDiff / 60_000), "minute");
  if (absDiff < 86_400_000) return formatter.format(sign * Math.round(absDiff / 3_600_000), "hour");
  if (absDiff < 30 * 86_400_000) return formatter.format(sign * Math.round(absDiff / 86_400_000), "day");
  return new Intl.DateTimeFormat(language, { month: "short", day: "numeric", year: "numeric" }).format(timestamp);
}

type NoteItemProps = {
  note: TaskNote;
  projectId: string;
  taskId: string;
};

function NoteItem({ note, projectId, taskId }: NoteItemProps) {
  const { t, i18n } = useTranslation("tasks");
  const { handle } = useWorkspace();
  const [editing, setEditing] = useState(false);

  const handleSave = (newValue: string) => {
    const trimmed = newValue.trim();
    if (trimmed && trimmed !== note.note) {
      if (handle) updateNote(handle, projectId, taskId, note.id, trimmed);
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (handle) deleteNote(handle, projectId, taskId, note.id);
  };

  if (editing) {
    return (
      <div className="p-3 rounded-md bg-[var(--surface-overlay)]">
        <RichTextEditor
          value={note.note}
          placeholder={t("notePlaceholder")}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="group p-3 rounded-md bg-[var(--surface-overlay)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 text-sm prose-compact">
          <Markdown>{note.note}</Markdown>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 shrink-0">
          <button
            className="btn btn-ghost btn-sm p-1 h-auto"
            onClick={() => setEditing(true)}
            title={t("editNote")}
          >
            <Pencil size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm p-1 h-auto"
            onClick={handleDelete}
            title={t("deleteNote")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="text-xs text-[var(--text-muted)] mt-1">
        {formatNoteTime(note.createdAt, i18n.language)}
        {note.updatedAt ? ` (${t("edited")})` : null}
      </div>
    </div>
  );
}

type NotesSectionProps = {
  projectId: string;
  taskId: string;
  notes: TaskNote[] | string;
};

export function NotesSection({ projectId, taskId, notes }: NotesSectionProps) {
  const { t } = useTranslation("tasks");
  const { handle } = useWorkspace();
  const [adding, setAdding] = useState(false);

  const normalizedNotes = getNotes(notes);
  const sortedNotes = useMemo(
    () => [...normalizedNotes].toSorted((a, b) => b.createdAt - a.createdAt),
    [normalizedNotes],
  );

  const handleAddSave = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      if (handle) addNote(handle, projectId, taskId, trimmed);
    }
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-3 py-3 border-t border-[var(--border-subtle)]">
      {adding ? (
        <div className="p-3 rounded-md bg-[var(--surface-overlay)]">
          <RichTextEditor
            value=""
            placeholder={t("notePlaceholder")}
            emptyText={t("addNote")}
            autoEdit
            onSave={handleAddSave}
          />
        </div>
      ) : (
        <button
          className="flex items-center gap-2 p-2 rounded-md bg-[var(--surface-overlay)] text-sm text-[var(--text-subtle)] cursor-pointer border-none w-full text-left"
          onClick={() => setAdding(true)}
        >
          <Plus size={16} className="shrink-0" />
          {t("addNote")}
        </button>
      )}

      {sortedNotes.length > 0 ? (
        <div className="flex flex-col gap-2">
          {sortedNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              projectId={projectId}
              taskId={taskId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
