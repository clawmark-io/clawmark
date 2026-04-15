import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragOverEvent, DragEndEvent, CollisionDetection } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useWorkspace } from "@/stores/workspace-context";
import { reorderColumns } from "@/lib/workspace/actions/columns/reorder-columns";
import { moveTaskToColumn } from "@/lib/workspace/actions/columns/move-task-to-column";
import type { Task, Column, Tag } from "@/types/data-model";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { KanbanMinimap } from "./kanban-minimap";

type KanbanBoardProps = {
  projectId: string;
  columns: Column[];
  tasksByColumn: Map<string, Task[]>;
  defaultColumnId: string | null;
  showAddColumn?: boolean;
  newTaskInputOnTop?: boolean;
  projectTags: Tag[];
};

function handleDragOverEvent(_event: DragOverEvent) {
  // Visual feedback is handled by useDroppable isOver state in KanbanColumn
}

export function KanbanBoard({ projectId, columns, tasksByColumn, defaultColumnId, newTaskInputOnTop, projectTags }: KanbanBoardProps) {
  const { handle } = useWorkspace();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"column" | "task" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    return pointerWithin(args);
  }, []);

  const findColumnOfTask = useCallback((taskId: string): string | null => {
    for (const [columnId, tasks] of tasksByColumn) {
      if (tasks.some((t) => t.id === taskId)) {
        return columnId;
      }
    }
    return null;
  }, [tasksByColumn]);

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as "column" | "task";
    setActiveId(event.active.id as string);
    setActiveType(type);
  };

  const handleDragOver = handleDragOverEvent;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      resetDrag();
      return;
    }

    if (activeType === "column") {
      if (active.id !== over.id) {
        const overId = over.data.current?.type === "column"
          ? (over.id as string)
          : over.data.current?.type === "column-droppable"
            ? over.data.current.columnId
            : over.data.current?.type === "task"
              ? over.data.current.columnId
              : null;
        if (overId && overId !== active.id) {
          if (handle) reorderColumns(handle, projectId, active.id as string, overId);
        }
      }
    } else if (activeType === "task") {
      const overData = over.data.current;
      let targetColumnId: string | null = null;
      let targetIndex: number;

      if (overData?.type === "task") {
        targetColumnId = overData.columnId as string;
        const columnTasks = tasksByColumn.get(targetColumnId!) || [];
        const overIndex = columnTasks.findIndex((t) => t.id === over.id);
        targetIndex = overIndex >= 0 ? overIndex : columnTasks.length;
      } else if (overData?.type === "column-droppable") {
        targetColumnId = overData.columnId as string;
        const columnTasks = tasksByColumn.get(targetColumnId!) || [];
        targetIndex = columnTasks.length;
      } else if (overData?.type === "column") {
        targetColumnId = over.id as string;
        const columnTasks = tasksByColumn.get(targetColumnId) || [];
        targetIndex = columnTasks.length;
      } else {
        resetDrag();
        return;
      }

      if (targetColumnId) {
        const sourceColumnId = findColumnOfTask(active.id as string);
        const isSameColumn = sourceColumnId === targetColumnId;

        if (isSameColumn && overData?.type === "task") {
          const columnTasks = tasksByColumn.get(targetColumnId) || [];
          const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
          const newIndex = columnTasks.findIndex((t) => t.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            if (handle) moveTaskToColumn(handle, projectId, active.id as string, targetColumnId, newIndex);
          }
        } else if (!isSameColumn) {
          if (handle) moveTaskToColumn(handle, projectId, active.id as string, targetColumnId, targetIndex!);
        }
      }
    }

    resetDrag();
  };

  const resetDrag = () => {
    setActiveId(null);
    setActiveType(null);
  };

  const activeTask = activeId && activeType === "task"
    ? findTaskById(activeId, tasksByColumn)
    : null;

  const activeColumn = activeId && activeType === "column"
    ? columns.find((c) => c.id === activeId)
    : null;

  const activeTaskColumnId = activeTask ? findColumnOfTask(activeTask.id) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
    >
      <div className="relative flex-1 min-h-0">
        <div ref={scrollContainerRef} className="flex gap-4 h-full overflow-x-auto overflow-y-hidden pb-2 items-start">
          <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn.get(column.id) || []}
                projectId={projectId}
                isDefaultColumn={column.id === defaultColumnId}
                newTaskInputOnTop={newTaskInputOnTop}
                projectTags={projectTags}
              />
            ))}
          </SortableContext>
        </div>
        <KanbanMinimap scrollContainerRef={scrollContainerRef} columns={columns} />
      </div>
      <DragOverlay>
        {activeColumn && (
          <KanbanColumn
            column={activeColumn}
            tasks={tasksByColumn.get(activeColumn.id) || []}
            projectId={projectId}
            isOverlay
            isDefaultColumn={activeColumn.id === defaultColumnId}
          />
        )}
        {activeTask && activeTaskColumnId && (
          <KanbanCard
            task={activeTask}
            projectId={projectId}
            columnId={activeTaskColumnId}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function findTaskById(taskId: string, tasksByColumn: Map<string, Task[]>): Task | null {
  for (const tasks of tasksByColumn.values()) {
    const task = tasks.find((t) => t.id === taskId);
    if (task) return task;
  }
  return null;
}
