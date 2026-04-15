import { Command } from "commander";
import type { ConnectionConfig } from "../lib/server-api";
import { fetchWorkspaceList } from "../lib/server-api";
import { connectWorkspace, waitForSync } from "../lib/connection";
import { resolveWorkspace, resolveProject, resolveColumn } from "../lib/resolve";
import { addColumn } from "@/lib/workspace/actions/columns/add-column";
import { updateColumn } from "@/lib/workspace/actions/columns/update-column";
import { deleteColumn } from "@/lib/workspace/actions/columns/delete-column";
import type { Column } from "@/types/data-model";
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

function formatColumn(c: Column) {
  return {
    id: c.id,
    title: c.title,
    color: c.color,
    backgroundColor: c.backgroundColor,
    sortOrder: c.sortOrder,
    autoComplete: c.autoComplete,
    taskLimit: c.taskLimit,
    hiddenOnKanban: c.hiddenOnKanban,
  };
}

export function registerProjectColumnCommand(program: Command): void {
  const pc = program
    .command("project-column")
    .alias("pc")
    .description("Manage project columns");

  pc.command("list")
    .description("List columns in a project")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .option("--search <text>", "Filter by title substring")
    .action(async (cmdOpts: { project?: string; search?: string }) => {
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
        let columns = [...project.columns].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );

        if (cmdOpts.search) {
          const search = cmdOpts.search.toLowerCase();
          columns = columns.filter((c) =>
            c.title.toLowerCase().includes(search),
          );
        }

        printResult(columns.map(formatColumn), opts.format);
      } finally {
        conn.disconnect();
      }
    });

  pc.command("add")
    .description("Add a column to a project")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("--title <title>", "Column title")
    .action(async (cmdOpts: { project?: string; title: string }) => {
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
        const columnId = addColumn(conn.handle, project.id, cmdOpts.title);
        await waitForSync();

        const updatedDoc = conn.handle.doc()!;
        const col = updatedDoc.projects[project.id].columns.find(
          (c) => c.id === columnId,
        )!;
        printResult(formatColumn(col), opts.format);
      } finally {
        conn.disconnect();
      }
    });

  pc.command("edit")
    .description("Edit a column")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("--column <name-or-id>", "Column name or ID")
    .option("--title <title>", "New title")
    .option("--color <color>", "New color")
    .option("--background-color <color>", "New background color")
    .option("--auto-complete <bool>", "Auto-complete tasks moved here")
    .option("--task-limit <number>", "Task limit (0 to remove)")
    .option("--hidden-on-kanban <bool>", "Hide on kanban board")
    .action(
      async (cmdOpts: {
        project?: string;
        column: string;
        title?: string;
        color?: string;
        backgroundColor?: string;
        autoComplete?: string;
        taskLimit?: string;
        hiddenOnKanban?: string;
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
          const column = resolveColumn(project.columns, cmdOpts.column);

          const updates: Partial<Column> = {};
          if (cmdOpts.title !== undefined) updates.title = cmdOpts.title;
          if (cmdOpts.color !== undefined)
            updates.color = cmdOpts.color || null;
          if (cmdOpts.backgroundColor !== undefined)
            updates.backgroundColor = cmdOpts.backgroundColor || null;
          if (cmdOpts.autoComplete !== undefined)
            updates.autoComplete = cmdOpts.autoComplete === "true";
          if (cmdOpts.taskLimit !== undefined) {
            const limit = parseInt(cmdOpts.taskLimit, 10);
            updates.taskLimit = limit === 0 ? null : limit;
          }
          if (cmdOpts.hiddenOnKanban !== undefined)
            updates.hiddenOnKanban = cmdOpts.hiddenOnKanban === "true";

          if (Object.keys(updates).length > 0) {
            updateColumn(conn.handle, project.id, column.id, updates);
            await waitForSync();
          }

          const updatedDoc = conn.handle.doc()!;
          const updatedCol = updatedDoc.projects[project.id].columns.find(
            (c) => c.id === column.id,
          )!;
          printResult(formatColumn(updatedCol), opts.format);
        } finally {
          conn.disconnect();
        }
      },
    );

  pc.command("del")
    .description("Delete a column")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("--column <name-or-id>", "Column name or ID")
    .action(async (cmdOpts: { project?: string; column: string }) => {
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
        const column = resolveColumn(project.columns, cmdOpts.column);

        if (column.id === project.defaultColumnId) {
          throw new Error("Cannot delete the default column.");
        }

        deleteColumn(conn.handle, project.id, column.id);
        await waitForSync();
        printResult(
          { deleted: true, id: column.id, title: column.title },
          opts.format,
        );
      } finally {
        conn.disconnect();
      }
    });
}
