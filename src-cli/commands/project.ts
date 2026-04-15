import { Command } from "commander";
import type { ConnectionConfig } from "../lib/server-api";
import { fetchWorkspaceList } from "../lib/server-api";
import { connectWorkspace, waitForSync } from "../lib/connection";
import { resolveWorkspace, resolveProject } from "../lib/resolve";
import { addProject } from "@/lib/workspace/actions/projects/add-project";
import { updateProject } from "@/lib/workspace/actions/projects/update-project";
import { deleteProjectCli } from "../actions/delete-project-cli";
import type { Project } from "@/types/data-model";
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

function requireWorkspace(opts: GlobalOpts): string {
  if (!opts.workspace) {
    throw new Error("-w/--workspace is required");
  }
  return opts.workspace;
}

function formatProject(p: Project) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    kanbanEnabled: p.kanbanEnabled,
    columnCount: p.columns.length,
    tagCount: p.tags.length,
    taskCount: Object.keys(p.tasks).length,
    defaultColumnId: p.defaultColumnId,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function registerProjectCommand(program: Command): void {
  const proj = program
    .command("project")
    .alias("p")
    .description("Manage projects");

  proj
    .command("list")
    .description("List projects in a workspace")
    .option("--search <text>", "Filter by title substring")
    .action(async (cmdOpts: { search?: string }) => {
      const opts = program.opts<GlobalOpts>();
      const wsName = requireWorkspace(opts);
      const config = getConfig(opts);
      const workspaces = await fetchWorkspaceList(config);
      const ws = resolveWorkspace(workspaces, wsName);
      if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

      const conn = await connectWorkspace(config, ws.workspaceId, ws.documentUrl);
      try {
        const doc = conn.handle.doc()!;
        let projects = Object.values(doc.projects).sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );

        if (cmdOpts.search) {
          const search = cmdOpts.search.toLowerCase();
          projects = projects.filter((p) =>
            p.title.toLowerCase().includes(search),
          );
        }

        printResult(projects.map(formatProject), opts.format);
      } finally {
        conn.disconnect();
      }
    });

  proj
    .command("add")
    .description("Create a new project")
    .requiredOption("--title <title>", "Project title")
    .action(async (cmdOpts: { title: string }) => {
      const opts = program.opts<GlobalOpts>();
      const wsName = requireWorkspace(opts);
      const config = getConfig(opts);
      const workspaces = await fetchWorkspaceList(config);
      const ws = resolveWorkspace(workspaces, wsName);
      if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

      const conn = await connectWorkspace(config, ws.workspaceId, ws.documentUrl);
      try {
        const projectId = addProject(conn.handle, cmdOpts.title);
        await waitForSync();
        const doc = conn.handle.doc()!;
        printResult(formatProject(doc.projects[projectId]), opts.format);
      } finally {
        conn.disconnect();
      }
    });

  proj
    .command("edit")
    .description("Edit a project")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .option("--title <title>", "New title")
    .option("--description <text>", "New description")
    .option("--kanban-enabled <bool>", "Enable/disable kanban")
    .action(
      async (cmdOpts: {
        project?: string;
        title?: string;
        description?: string;
        kanbanEnabled?: string;
      }) => {
        const opts = program.opts<GlobalOpts>();
        const wsName = requireWorkspace(opts);
        const projectRef = cmdOpts.project ?? opts.project;
        if (!projectRef) throw new Error("-p/--project is required");
        const config = getConfig(opts);
        const workspaces = await fetchWorkspaceList(config);
        const ws = resolveWorkspace(workspaces, wsName);
        if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

        const conn = await connectWorkspace(
          config,
          ws.workspaceId,
          ws.documentUrl,
        );
        try {
          const doc = conn.handle.doc()!;
          const project = resolveProject(doc, projectRef);

          const updates: Partial<Project> = {};
          if (cmdOpts.title !== undefined) updates.title = cmdOpts.title;
          if (cmdOpts.description !== undefined)
            updates.description = cmdOpts.description;
          if (cmdOpts.kanbanEnabled !== undefined)
            updates.kanbanEnabled = cmdOpts.kanbanEnabled === "true";

          if (Object.keys(updates).length > 0) {
            updateProject(conn.handle, project.id, updates);
            await waitForSync();
          }

          const updatedDoc = conn.handle.doc()!;
          printResult(
            formatProject(updatedDoc.projects[project.id]),
            opts.format,
          );
        } finally {
          conn.disconnect();
        }
      },
    );

  proj
    .command("del")
    .description("Delete a project")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .action(async (cmdOpts: { project?: string }) => {
      const opts = program.opts<GlobalOpts>();
      const wsName = requireWorkspace(opts);
      const projectRef = cmdOpts.project ?? opts.project;
      if (!projectRef) throw new Error("-p/--project is required");
      const config = getConfig(opts);
      const workspaces = await fetchWorkspaceList(config);
      const ws = resolveWorkspace(workspaces, wsName);
      if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

      const conn = await connectWorkspace(
        config,
        ws.workspaceId,
        ws.documentUrl,
      );
      try {
        const doc = conn.handle.doc()!;
        const project = resolveProject(doc, projectRef);
        deleteProjectCli(conn.handle, project.id);
        await waitForSync();
        printResult(
          { deleted: true, id: project.id, title: project.title },
          opts.format,
        );
      } finally {
        conn.disconnect();
      }
    });
}
