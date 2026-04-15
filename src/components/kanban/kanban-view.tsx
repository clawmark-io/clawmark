import { useState, useMemo, type ReactNode } from "react";
import { useParams } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import type { Task } from "@/types/data-model";
import { KanbanToolbar } from "./kanban-toolbar";
import { KanbanBoard } from "./kanban-board";

type KanbanViewProps = {
  renderHeaderActions?: () => ReactNode;
};

type CompletedFilter = "all" | "active" | "completed";

function filterTasks(tasks: Task[], searchQuery: string, completedFilter: CompletedFilter, showSnoozed: boolean, selectedTagIds: string[]): Task[] {
  const now = Date.now();
  return tasks.filter((task) => {
    if (task.archived) return false;
    if (!showSnoozed && task.snoozeUntil !== null && task.snoozeUntil > now) return false;
    if (completedFilter === "active" && task.completed) return false;
    if (completedFilter === "completed" && !task.completed) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !task.title.toLowerCase().includes(query) &&
        !task.description.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    if (selectedTagIds.length > 0) {
      if (!selectedTagIds.every((id) => task.tags.includes(id))) return false;
    }

    return true;
  });
}

export function KanbanView({ renderHeaderActions }: KanbanViewProps) {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { workspace } = useWorkspace();

  if (renderHeaderActions) {
    renderHeaderActions();
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [completedFilter, setCompletedFilter] = useState<CompletedFilter>("all");
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [showHiddenColumns, setShowHiddenColumns] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const project = projectId ? workspace?.projects[projectId] : undefined;

  const columns = useMemo(() => {
    if (!project) return [];
    return [...project.columns]
      .filter((c) => showHiddenColumns || !c.hiddenOnKanban)
      .toSorted((a, b) => a.sortOrder - b.sortOrder);
  }, [project, showHiddenColumns]);

  const allTasks = useMemo(() => {
    if (!project) return [];
    return Object.values(project.tasks);
  }, [project]);

  const filteredTasks = useMemo(() => {
    return filterTasks(allTasks, searchQuery, completedFilter, showSnoozed, selectedTagIds);
  }, [allTasks, searchQuery, completedFilter, showSnoozed, selectedTagIds]);

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const column of columns) {
      map.set(column.id, []);
    }
    for (const task of filteredTasks) {
      if (task.columnId && map.has(task.columnId)) {
        map.get(task.columnId)!.push(task);
      }
    }
    for (const [columnId, tasks] of map) {
      map.set(columnId, tasks.toSorted((a, b) => a.sortOrder - b.sortOrder));
    }
    return map;
  }, [columns, filteredTasks]);

  const totalFilteredCount = useMemo(() => {
    let count = 0;
    for (const tasks of tasksByColumn.values()) {
      count += tasks.length;
    }
    return count;
  }, [tasksByColumn]);

  if (!project || !projectId) return null;

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <KanbanToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTagIds={selectedTagIds}
        onTagsChange={setSelectedTagIds}
        projectTags={project.tags ?? []}
        completedFilter={completedFilter}
        onCompletedFilterChange={setCompletedFilter}
        taskCount={totalFilteredCount}
        showSnoozed={showSnoozed}
        onShowSnoozedChange={setShowSnoozed}
        showHiddenColumns={showHiddenColumns}
        onShowHiddenColumnsChange={setShowHiddenColumns}
        hasHiddenColumns={project.columns.some((c) => c.hiddenOnKanban)}
      />
      <KanbanBoard
        projectId={projectId}
        columns={columns}
        tasksByColumn={tasksByColumn}
        defaultColumnId={project.defaultColumnId}
        newTaskInputOnTop={project.newTaskInputOnTop ?? false}
        projectTags={project.tags ?? []}
      />
    </div>
  );
}
