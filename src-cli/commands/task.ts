import { Command } from "commander";
import type { ConnectionConfig } from "../lib/server-api";
import { fetchWorkspaceList } from "../lib/server-api";
import { connectWorkspace, waitForSync } from "../lib/connection";
import {
  resolveWorkspace,
  resolveProject,
  resolveTask,
  resolveTag,
  resolveColumn,
} from "../lib/resolve";
import { addTask } from "@/lib/workspace/actions/tasks/add-task";
import { updateTask } from "@/lib/workspace/actions/tasks/update-task";
import { deleteTask } from "@/lib/workspace/actions/tasks/delete-task";
import { moveTaskToColumn } from "@/lib/workspace/actions/columns/move-task-to-column";
import { addNote } from "@/lib/workspace/actions/notes/add-note";
import { getNotes } from "@/lib/utils/notes";
import type { Task, Project } from "@/types/data-model";
import type { OutputFormat } from "../lib/output";
import { printResult } from "../lib/output";

type GlobalOpts = {
  host: string;
  port: number;
  tls: boolean;
  key: string;
  format: OutputFormat;
  workspace?: string;
  project?: string;
};

function getConfig(opts: GlobalOpts): ConnectionConfig {
  return {
    host: opts.host,
    port: opts.port,
    tls: opts.tls,
    accessToken: opts.key,
  };
}

function formatTask(t: Task, project?: Project) {
  const result: Record<string, unknown> = {
    id: t.id,
    title: t.title,
    completed: t.completed,
    columnId: t.columnId,
    sortOrder: t.sortOrder,
    tags: t.tags,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
  if (t.emoji) result.emoji = t.emoji;
  if (t.description) result.description = t.description;
  if (t.color) result.color = t.color;
  if (t.dueDate) result.dueDate = t.dueDate;
  if (t.snoozeUntil) result.snoozeUntil = t.snoozeUntil;
  if (t.archived) result.archived = t.archived;
  if (t.archivedAt) result.archivedAt = t.archivedAt;
  if (t.completedAt) result.completedAt = t.completedAt;
  const notes = getNotes(t.notes);
  if (notes.length > 0) result.notes = notes;
  if (t.subtasks.length > 0) result.subtasks = t.subtasks;

  if (project) {
    const col = project.columns.find((c) => c.id === t.columnId);
    if (col) result.columnName = col.title;

    if (t.tags.length > 0) {
      result.tagNames = t.tags
        .map((tagId) => project.tags.find((pt) => pt.id === tagId)?.label)
        .filter(Boolean);
    }
  }

  return result;
}

export function registerTaskCommand(program: Command): void {
  const task = program
    .command("task")
    .alias("t")
    .description("Manage tasks");

  task
    .command("list")
    .description("List tasks")
    .option("-p, --project <name-or-id>", "Project name or ID (omit for all)")
    .option("--completed", "Show only completed tasks")
    .option("--no-completed", "Show only incomplete tasks")
    .option("--archived", "Include archived tasks (excluded by default)")
    .option("--tags <tags>", "Comma-separated tag names/IDs (must have ALL)")
    .option(
      "--columns <columns>",
      "Comma-separated column names/IDs (tasks from these only)",
    )
    .option("--search <text>", "Filter by title substring")
    .option(
      "--sort <field>",
      "Sort by: order (sortOrder) or modify (updatedAt)",
      "order",
    )
    .option("--order <dir>", "Sort direction: asc or desc", "asc")
    .action(
      async (cmdOpts: {
        project?: string;
        completed?: boolean;
        archived?: boolean;
        tags?: string;
        columns?: string;
        search?: string;
        sort: string;
        order: string;
      }) => {
        const opts = program.opts<GlobalOpts>();
        if (!opts.workspace) throw new Error("-w/--workspace is required");
        const config = getConfig(opts);
        const workspaces = await fetchWorkspaceList(config);
        const ws = resolveWorkspace(workspaces, opts.workspace);
        if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

        const conn = await connectWorkspace(
          config,
          ws.workspaceId,
          ws.documentUrl,
        );
        try {
          const doc = conn.handle.doc()!;
          const projectRef = cmdOpts.project ?? opts.project;

          const projectsToList = projectRef
            ? [resolveProject(doc, projectRef)]
            : Object.values(doc.projects).sort(
                (a, b) => a.sortOrder - b.sortOrder,
              );

          const allResults: Array<{
            projectId: string;
            projectTitle: string;
            tasks: ReturnType<typeof formatTask>[];
          }> = [];

          for (const project of projectsToList) {
            let tasks = Object.values(project.tasks) as Task[];

            // Filter out archived by default
            if (!cmdOpts.archived) {
              tasks = tasks.filter((t) => !t.archived);
            }

            // Filter by completion
            if (cmdOpts.completed === true) {
              tasks = tasks.filter((t) => t.completed);
            } else if (cmdOpts.completed === false) {
              tasks = tasks.filter((t) => !t.completed);
            }

            // Filter by tags (AND logic)
            if (cmdOpts.tags) {
              const tagNames = cmdOpts.tags.split(",").map((s) => s.trim());
              const tagIds = tagNames.map(
                (name) => resolveTag(project.tags, name).id,
              );
              tasks = tasks.filter((t) =>
                tagIds.every((id) => t.tags.includes(id)),
              );
            }

            // Filter by columns
            if (cmdOpts.columns) {
              const colNames = cmdOpts.columns.split(",").map((s) => s.trim());
              const colIds = colNames.map(
                (name) => resolveColumn(project.columns, name).id,
              );
              tasks = tasks.filter(
                (t) => t.columnId !== null && colIds.includes(t.columnId),
              );
            }

            // Filter by search
            if (cmdOpts.search) {
              const search = cmdOpts.search.toLowerCase();
              tasks = tasks.filter((t) =>
                t.title.toLowerCase().includes(search),
              );
            }

            // Sort
            const ascending = cmdOpts.order === "asc";
            if (cmdOpts.sort === "modify") {
              tasks.sort((a, b) =>
                ascending
                  ? a.updatedAt - b.updatedAt
                  : b.updatedAt - a.updatedAt,
              );
            } else {
              tasks.sort((a, b) =>
                ascending
                  ? a.sortOrder - b.sortOrder
                  : b.sortOrder - a.sortOrder,
              );
            }

            allResults.push({
              projectId: project.id,
              projectTitle: project.title,
              tasks: tasks.map((t) => formatTask(t, project)),
            });
          }

          // If single project, flatten
          if (projectRef) {
            printResult(allResults[0]?.tasks ?? [], opts.format);
          } else {
            printResult(allResults, opts.format);
          }
        } finally {
          conn.disconnect();
        }
      },
    );

  task
    .command("add")
    .description("Add a new task")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("--title <title>", "Task title")
    .option("--description <text>", "Task description")
    .option("--color <color>", "Task color")
    .option("--emoji <emoji>", "Task emoji")
    .option("--due-date <date>", "Due date (ISO 8601)")
    .option("--column <name-or-id>", "Column to place task in")
    .option("--tags <tags>", "Comma-separated tag names/IDs")
    .option("--note <text>", "Add a note to the task")
    .action(
      async (cmdOpts: {
        project?: string;
        title: string;
        description?: string;
        color?: string;
        emoji?: string;
        dueDate?: string;
        column?: string;
        tags?: string;
        note?: string;
      }) => {
        const opts = program.opts<GlobalOpts>();
        if (!opts.workspace) throw new Error("-w/--workspace is required");
        const projectRef = cmdOpts.project ?? opts.project;
        if (!projectRef) throw new Error("-p/--project is required");
        const config = getConfig(opts);
        const workspaces = await fetchWorkspaceList(config);
        const ws = resolveWorkspace(workspaces, opts.workspace);
        if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

        const conn = await connectWorkspace(
          config,
          ws.workspaceId,
          ws.documentUrl,
        );
        try {
          const doc = conn.handle.doc()!;
          const project = resolveProject(doc, projectRef);

          const taskId = addTask(conn.handle, project.id, cmdOpts.title);

          // Apply additional fields
          const updates: Partial<Task> = {};
          if (cmdOpts.description !== undefined)
            updates.description = cmdOpts.description;
          if (cmdOpts.color !== undefined) updates.color = cmdOpts.color;
          if (cmdOpts.emoji !== undefined) updates.emoji = cmdOpts.emoji;
          if (cmdOpts.dueDate !== undefined)
            updates.dueDate = new Date(cmdOpts.dueDate).getTime();
          if (cmdOpts.tags !== undefined) {
            const tagNames = cmdOpts.tags.split(",").map((s) => s.trim());
            updates.tags = tagNames.map(
              (name) => resolveTag(project.tags, name).id,
            );
          }

          if (Object.keys(updates).length > 0) {
            updateTask(conn.handle, project.id, taskId, updates);
          }

          if (cmdOpts.note !== undefined) {
            addNote(conn.handle, project.id, taskId, cmdOpts.note);
          }

          // Move to specified column if different from default
          if (cmdOpts.column !== undefined) {
            const col = resolveColumn(project.columns, cmdOpts.column);
            const currentDoc = conn.handle.doc()!;
            const currentTask = currentDoc.projects[project.id].tasks[taskId];
            if (currentTask.columnId !== col.id) {
              const colTasks = (
                Object.values(
                  currentDoc.projects[project.id].tasks,
                ) as Task[]
              ).filter(
                (t) => t.id !== taskId && t.columnId === col.id,
              ).length;
              moveTaskToColumn(
                conn.handle,
                project.id,
                taskId,
                col.id,
                colTasks,
              );
            }
          }

          await waitForSync();

          const updatedDoc = conn.handle.doc()!;
          const updatedProject = updatedDoc.projects[project.id];
          printResult(
            formatTask(updatedProject.tasks[taskId], updatedProject),
            opts.format,
          );
        } finally {
          conn.disconnect();
        }
      },
    );

  task
    .command("edit")
    .description("Edit a task")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("-t, --task <name-or-id>", "Task name or ID")
    .option("--title <title>", "New title")
    .option("--description <text>", "New description")
    .option("--color <color>", "New color (empty to clear)")
    .option("--emoji <emoji>", "New emoji (empty to clear)")
    .option("--completed <bool>", "Mark completed (true/false)")
    .option("--archived <bool>", "Mark archived (true/false)")
    .option("--due-date <date>", "Due date (ISO 8601, empty to clear)")
    .option("--column <name-or-id>", "Move to column")
    .option("--tags <tags>", "Set tags (comma-separated names/IDs)")
    .option("--note <text>", "Add a note to the task")
    .action(
      async (cmdOpts: {
        project?: string;
        task: string;
        title?: string;
        description?: string;
        color?: string;
        emoji?: string;
        completed?: string;
        archived?: string;
        dueDate?: string;
        column?: string;
        tags?: string;
        note?: string;
      }) => {
        const opts = program.opts<GlobalOpts>();
        if (!opts.workspace) throw new Error("-w/--workspace is required");
        const projectRef = cmdOpts.project ?? opts.project;
        if (!projectRef) throw new Error("-p/--project is required");
        const config = getConfig(opts);
        const workspaces = await fetchWorkspaceList(config);
        const ws = resolveWorkspace(workspaces, opts.workspace);
        if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

        const conn = await connectWorkspace(
          config,
          ws.workspaceId,
          ws.documentUrl,
        );
        try {
          const doc = conn.handle.doc()!;
          const project = resolveProject(doc, projectRef);
          const taskRef = resolveTask(project.tasks, cmdOpts.task);

          const updates: Partial<Task> = {};
          if (cmdOpts.title !== undefined) updates.title = cmdOpts.title;
          if (cmdOpts.description !== undefined)
            updates.description = cmdOpts.description;
          if (cmdOpts.color !== undefined)
            updates.color = cmdOpts.color || null;
          if (cmdOpts.emoji !== undefined)
            updates.emoji = cmdOpts.emoji || null;
          if (cmdOpts.completed !== undefined)
            updates.completed = cmdOpts.completed === "true";
          if (cmdOpts.archived !== undefined)
            updates.archived = cmdOpts.archived === "true";
          if (cmdOpts.dueDate !== undefined) {
            updates.dueDate = cmdOpts.dueDate
              ? new Date(cmdOpts.dueDate).getTime()
              : null;
          }
          if (cmdOpts.tags !== undefined) {
            const tagNames = cmdOpts.tags.split(",").map((s) => s.trim());
            updates.tags = tagNames
              .filter((s) => s.length > 0)
              .map((name) => resolveTag(project.tags, name).id);
          }

          if (Object.keys(updates).length > 0) {
            updateTask(conn.handle, project.id, taskRef.id, updates);
          }

          if (cmdOpts.note !== undefined) {
            addNote(conn.handle, project.id, taskRef.id, cmdOpts.note);
          }

          // Move to column if specified
          if (cmdOpts.column !== undefined) {
            const col = resolveColumn(project.columns, cmdOpts.column);
            const currentDoc = conn.handle.doc()!;
            const currentTask =
              currentDoc.projects[project.id].tasks[taskRef.id];
            if (currentTask.columnId !== col.id) {
              const colTasks = (
                Object.values(
                  currentDoc.projects[project.id].tasks,
                ) as Task[]
              ).filter(
                (t) => t.id !== taskRef.id && t.columnId === col.id,
              ).length;
              moveTaskToColumn(
                conn.handle,
                project.id,
                taskRef.id,
                col.id,
                colTasks,
              );
            }
          }

          await waitForSync();

          const updatedDoc = conn.handle.doc()!;
          const updatedProject = updatedDoc.projects[project.id];
          printResult(
            formatTask(updatedProject.tasks[taskRef.id], updatedProject),
            opts.format,
          );
        } finally {
          conn.disconnect();
        }
      },
    );

  task
    .command("del")
    .description("Delete a task")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("-t, --task <name-or-id>", "Task name or ID")
    .action(async (cmdOpts: { project?: string; task: string }) => {
      const opts = program.opts<GlobalOpts>();
      if (!opts.workspace) throw new Error("-w/--workspace is required");
      const projectRef = cmdOpts.project ?? opts.project;
      if (!projectRef) throw new Error("-p/--project is required");
      const config = getConfig(opts);
      const workspaces = await fetchWorkspaceList(config);
      const ws = resolveWorkspace(workspaces, opts.workspace);
      if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

      const conn = await connectWorkspace(
        config,
        ws.workspaceId,
        ws.documentUrl,
      );
      try {
        const doc = conn.handle.doc()!;
        const project = resolveProject(doc, projectRef);
        const taskRef = resolveTask(project.tasks, cmdOpts.task);
        deleteTask(conn.handle, project.id, taskRef.id);
        await waitForSync();
        printResult(
          { deleted: true, id: taskRef.id, title: taskRef.title },
          opts.format,
        );
      } finally {
        conn.disconnect();
      }
    });
}
