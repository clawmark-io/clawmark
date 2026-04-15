import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, Plus } from 'lucide-react';
import { useWorkspace } from "@/stores/workspace-context";
import { updateTask } from "@/lib/workspace/actions/tasks/update-task";
import { addTaskToColumn } from "@/lib/workspace/actions/columns/add-task-to-column";
import { addTaskToColumnTop } from "@/lib/workspace/actions/columns/add-task-to-column-top";
import { useColumnSettingsState } from "@/stores/column-settings";
import type { Task, Column, Tag } from "@/types/data-model";
import { useContrastText } from "@/hooks/use-contrast-text";
import { TaskTagInput } from "@/components/ui/task-tag-input";
import { KanbanCard } from "./kanban-card";

type KanbanColumnProps = {
  column: Column;
  tasks: Task[];
  projectId: string;
  isOverlay?: boolean;
  isDefaultColumn?: boolean;
  newTaskInputOnTop?: boolean;
  projectTags?: Tag[];
};

export function KanbanColumn({ column, tasks, projectId, isOverlay, newTaskInputOnTop, projectTags = [] }: KanbanColumnProps) {
  const { handle } = useWorkspace();
  const { showColumnSettings } = useColumnSettingsState();

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
    disabled: isOverlay,
  });

  const { textClass: columnTextClass } = useContrastText(column.backgroundColor);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-droppable-${column.id}`,
    data: { type: "column-droppable", columnId: column.id },
    disabled: isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const handleAddTask = (title: string, tagIds: string[]) => {
    const taskId = handle ? addTaskToColumn(handle, projectId, title, column.id) : "";
    if (taskId && tagIds.length > 0) {
      updateTask(handle!, projectId, taskId, { tags: tagIds });
    }
  };

  const handleAddTaskTop = (title: string, tagIds: string[]) => {
    const taskId = handle ? addTaskToColumnTop(handle, projectId, title, column.id) : "";
    if (taskId && tagIds.length > 0) {
      updateTask(handle!, projectId, taskId, { tags: tagIds });
    }
  };

  const className = [
    "flex flex-col w-[280px] min-w-[280px] max-h-full rounded-lg bg-base-200 border border-[var(--border-subtle)] shrink-0",
    isDragging ? "opacity-40" : "",
    isOverlay ? "shadow-[0_4px_16px_var(--shadow-md)]" : "",
    columnTextClass,
  ].filter(Boolean).join(" ");

  const columnStyle = {
    ...style,
    ...(column.backgroundColor ? { backgroundColor: column.backgroundColor } : {}),
  };

  const kanbanInputFormClass = "flex items-center gap-2 py-1.5 px-2 rounded-md border-none bg-transparent w-full transition-colors duration-150 focus-within:bg-[var(--surface-overlay)]";
  const kanbanInputClass = "flex-1 min-w-0 border-none bg-transparent text-inherit text-xs outline-none placeholder:text-[var(--text-placeholder)]";

  return (
    <div ref={isOverlay ? undefined : setSortableRef} style={columnStyle} className={className}>
      <div
        className="flex items-center gap-2 py-2.5 px-3 border-b border-[var(--border-subtle)] cursor-grab active:cursor-grabbing"
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
      >
        {column.color && (
          <div className="w-[3px] h-3.5 rounded-sm shrink-0" style={{ background: column.color }} />
        )}
        <span className="flex-1 min-w-0 font-semibold truncate">{column.title}</span>
        <span className={`shrink-0 text-sm text-muted px-1.5 rounded bg-[var(--surface-overlay-hover)] ${column.taskLimit !== null && tasks.length > column.taskLimit ? "bg-[var(--warning-bg)] text-[var(--warning-text)]" : ""}`}>
          {tasks.length}
          {column.taskLimit !== null && ` / ${column.taskLimit}`}
        </span>
        <div className="shrink-0" role="presentation" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-ghost btn-square btn-xs"
            onClick={() => showColumnSettings(projectId, column.id)}
          >
            <Edit size={16} />
          </button>
        </div>
      </div>

      {!isOverlay && newTaskInputOnTop ? (
        <div className="p-1.5 border-b border-[var(--border-subtle)]">
          <TaskTagInput
            projectTags={projectTags}
            placeholder="Add to top..."
            onSubmit={handleAddTaskTop}
            formClassName={kanbanInputFormClass}
            inputClassName={kanbanInputClass}
            icon={<Plus size={14} className="shrink-0 text-muted" />}
          />
        </div>
      ) : null}

      <div
        ref={isOverlay ? undefined : setDroppableRef}
        className={`flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5 min-h-[40px] scrollbar-thin ${isOver ? "bg-[var(--surface-overlay)]" : ""}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectId={projectId}
              columnId={column.id}
              isOverlay={isOverlay}
            />
          ))}
          {tasks.length === 0 && !isOver && (
            <div className="flex items-center justify-center p-4 text-xs text-muted">Drop tasks here</div>
          )}
        </SortableContext>
      </div>

      {!isOverlay ? (
        <div className="p-1.5 border-t border-[var(--border-subtle)]">
          <TaskTagInput
            projectTags={projectTags}
            placeholder="Add a task..."
            onSubmit={handleAddTask}
            formClassName={kanbanInputFormClass}
            inputClassName={kanbanInputClass}
            icon={<Plus size={14} className="shrink-0 text-muted" />}
          />
        </div>
      ) : null}
    </div>
  );
}
