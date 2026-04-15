import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { useParams } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import { reorderTask } from "@/lib/workspace/actions/tasks/reorder-task";
import type { Column, Task } from "@/types/data-model";
import { TasksToolbar } from "./tasks-toolbar";
import { TaskAddInput } from "./task-add-input";
import { TaskRow } from "./task-row";

type CompletedFilter = "all" | "active" | "completed";
type SortBy = "sortOrder" | "sortOrderGrouped" | "createdAt" | "dueDate" | "title";

function filterTasks(tasks: Task[], searchQuery: string, completedFilter: CompletedFilter, showArchived: boolean, showSnoozed: boolean, selectedTagIds: string[], selectedColumnIds: string[], columns: Column[]): Task[] {
  const now = Date.now();
  return tasks.filter((task) => {
    if (!showArchived && task.archived) return false;
    if (!showSnoozed && task.snoozeUntil !== null && task.snoozeUntil > now) return false;

    if (completedFilter === "active" && task.completed) return false;
    if (completedFilter === "completed" && !task.completed) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(query)) return false;
    }

    if (selectedTagIds.length > 0) {
      if (!selectedTagIds.every((id) => task.tags.includes(id))) return false;
    }

    if (selectedColumnIds.length > 0 && selectedColumnIds.length < columns.length) {
      if (!task.columnId || !selectedColumnIds.includes(task.columnId)) return false;
    }

    return true;
  });
}

function sortTasks(tasks: Task[], sortBy: SortBy, reversed: boolean): Task[] {
  const sorted = [...tasks];
  let result: Task[];
  switch (sortBy) {
    case "sortOrder":
      result = sorted.toSorted((a, b) => a.sortOrder - b.sortOrder);
      break;
    case "sortOrderGrouped": {
      const incomplete = sorted.filter((t) => !t.completed).toSorted((a, b) => a.sortOrder - b.sortOrder);
      const complete = sorted.filter((t) => t.completed).toSorted((a, b) => a.sortOrder - b.sortOrder);
      result = [...incomplete, ...complete];
      break;
    }
    case "createdAt":
      result = sorted.toSorted((a, b) => b.createdAt - a.createdAt);
      break;
    case "dueDate":
      result = sorted.toSorted((a, b) => {
        if (a.dueDate === null && b.dueDate === null) return 0;
        if (a.dueDate === null) return 1;
        if (b.dueDate === null) return -1;
        return a.dueDate - b.dueDate;
      });
      break;
    case "title":
      result = sorted.toSorted((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      result = sorted;
  }
  const isManualSort = sortBy === "sortOrder" || sortBy === "sortOrderGrouped";
  if (reversed && !isManualSort) result.reverse();
  return result;
}

export function TasksView() {
  const { t } = useTranslation("tasks");
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { workspace, handle } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [completedFilter, setCompletedFilter] = useState<CompletedFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("sortOrderGrouped");
  const [sortReversed, setSortReversed] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);

  const project = projectId ? workspace?.projects[projectId] : undefined;

  const allTasks = useMemo(() => {
    if (!project) return [];
    return Object.values(project.tasks);
  }, [project]);

  const tasks = useMemo(() => {
    const columns = project?.columns ?? [];
    const filtered = filterTasks(allTasks, searchQuery, completedFilter, showArchived, showSnoozed, selectedTagIds, selectedColumnIds, columns);
    return sortTasks(filtered, sortBy, sortReversed);
  }, [allTasks, searchQuery, completedFilter, sortBy, sortReversed, showArchived, showSnoozed, selectedTagIds, selectedColumnIds, project?.columns]);

  const archivedCount = allTasks.filter((task) => task.archived).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const isDragEnabled = (sortBy === "sortOrder" || sortBy === "sortOrderGrouped") && !searchQuery && completedFilter === "all" && !showArchived && selectedTagIds.length === 0 && selectedColumnIds.length === 0;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over || !projectId || active.id === over.id) return;
    if (sortBy === "sortOrderGrouped") {
      const activeTask = tasks.find((task) => task.id === active.id);
      const overTask = tasks.find((task) => task.id === over.id);
      if (!activeTask || !overTask || activeTask.completed !== overTask.completed) return;
    }
    if (handle) reorderTask(handle, projectId, active.id as string, over.id as string);
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
  };

  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) ?? null : null;

  if (!project || !projectId) return null;

  return (
    <div className="flex flex-col gap-2">
      <TasksToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTagIds={selectedTagIds}
        onTagsChange={setSelectedTagIds}
        projectTags={project.tags ?? []}
        completedFilter={completedFilter}
        onCompletedFilterChange={setCompletedFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortReversed={sortReversed}
        onSortReversedChange={setSortReversed}
        taskCount={tasks.length}
        archivedCount={archivedCount}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        showSnoozed={showSnoozed}
        onShowSnoozedChange={setShowSnoozed}
        columns={project.kanbanEnabled ? [...project.columns].toSorted((a, b) => a.sortOrder - b.sortOrder) : []}
        selectedColumnIds={selectedColumnIds}
        onColumnFilterChange={setSelectedColumnIds}
      />
      <TaskAddInput projectId={projectId} projectTags={project.tags ?? []} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                projectId={projectId}
                dragDisabled={!isDragEnabled}
              />
            ))}
            {tasks.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--text-placeholder)]">
                {searchQuery || completedFilter !== "all" || selectedTagIds.length > 0 || selectedColumnIds.length > 0
                  ? t("noMatchingTasks", { ns: "common" })
                  : t("noTasksYet")}
              </div>
            )}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeTask ? (
            <TaskRow
              task={activeTask}
              projectId={projectId}
              dragDisabled
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
