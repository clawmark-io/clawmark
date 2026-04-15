import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { TaskCheckbox } from "@/components/ui/task-checkbox";
import { useWorkspace } from "@/stores/workspace-context";
import { addSubtask } from "@/lib/workspace/actions/subtasks/add-subtask";
import { updateSubtask } from "@/lib/workspace/actions/subtasks/update-subtask";
import { deleteSubtask } from "@/lib/workspace/actions/subtasks/delete-subtask";
import { toggleSubtaskCompletion } from "@/lib/workspace/actions/subtasks/toggle-subtask-completion";
import { reorderSubtasks } from "@/lib/workspace/actions/subtasks/reorder-subtasks";
import type { Subtask } from "@/types/data-model";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SubtasksSectionProps {
  projectId: string;
  taskId: string;
  subtasks: Subtask[];
}

interface SubtaskItemProps {
  subtask: Subtask;
  projectId: string;
  taskId: string;
}

function SubtaskItem({ subtask, projectId, taskId }: SubtaskItemProps) {
  const { handle } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(subtask.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTitleBlur = () => {
    setEditing(false);
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== subtask.title) {
      if (handle) updateSubtask(handle, projectId, taskId, subtask.id, { title: trimmed });
    } else {
      setLocalTitle(subtask.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setLocalTitle(subtask.title);
      setEditing(false);
    }
  };

  const handleDelete = () => {
    if (handle) deleteSubtask(handle, projectId, taskId, subtask.id);
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-2 p-2 rounded-md bg-[var(--surface-overlay)] transition-colors duration-150">
      <div className="cursor-grab text-[var(--text-subtle)] flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      <div role="button" tabIndex={0} className="shrink-0 flex items-center cursor-pointer" onClick={() => handle && toggleSubtaskCompletion(handle, projectId, taskId, subtask.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (handle) toggleSubtaskCompletion(handle, projectId, taskId, subtask.id); } }}>
        <TaskCheckbox checked={subtask.completed} />
      </div>
      {editing ? (
        <input
          className="flex-1 min-w-0 border-b border-[var(--border-default)] bg-transparent text-inherit text-sm py-0.5 outline-none border-t-0 border-x-0"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          autoFocus
        />
      ) : (
        <span
          role="button"
          tabIndex={0}
          className={`flex-1 min-w-0 cursor-pointer text-sm ${subtask.completed ? "line-through opacity-50" : ""}`}
          onClick={() => setEditing(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditing(true); } }}
        >
          {subtask.title}
        </span>
      )}
      <button
        className="btn btn-ghost btn-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100 p-1 h-auto"
        onClick={handleDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function SubtasksSection({ projectId, taskId, subtasks }: SubtasksSectionProps) {
  const { t } = useTranslation("tasks");
  const { handle } = useWorkspace();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedSubtasks = [...subtasks].toSorted((a, b) => a.sortOrder - b.sortOrder);
  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    if (handle) addSubtask(handle, projectId, taskId, trimmed);
    setNewSubtaskTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddSubtask();
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setNewSubtaskTitle("");
      e.currentTarget.blur();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedSubtasks.findIndex((s) => s.id === active.id);
    const newIndex = sortedSubtasks.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      if (handle) reorderSubtasks(handle, projectId, taskId, active.id as string, newIndex);
    }
  };

  return (
    <div className="flex flex-col gap-3 py-3 border-t border-[var(--border-subtle)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold m-0">{t("subtasks")}</h3>
        {totalCount > 0 && (
          <span className="text-sm tabular-nums">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedSubtasks.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {sortedSubtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                projectId={projectId}
                taskId={taskId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex items-center gap-2 p-2 rounded-md bg-[var(--surface-overlay)]">
        <Plus size={16} className="text-[var(--text-subtle)] shrink-0" />
        <input
          className="flex-1 min-w-0 border-none bg-transparent text-inherit text-sm outline-none placeholder:text-[var(--text-subtle)]"
          placeholder={t("addSubtask")}
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
