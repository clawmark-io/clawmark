import { Command } from "commander";
import type { ConnectionConfig } from "../lib/server-api";
import { fetchWorkspaceList } from "../lib/server-api";
import { connectWorkspace, waitForSync } from "../lib/connection";
import { resolveWorkspace, resolveProject, resolveTag } from "../lib/resolve";
import { addTag } from "@/lib/workspace/actions/tags/add-tag";
import { updateTag } from "@/lib/workspace/actions/tags/update-tag";
import { deleteTag } from "@/lib/workspace/actions/tags/delete-tag";
import { createTag } from "@/lib/data-model";
import type { Tag } from "@/types/data-model";
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

function formatTag(t: Tag) {
  return { id: t.id, label: t.label, color: t.color };
}

export function registerProjectTagCommand(program: Command): void {
  const pt = program
    .command("project-tag")
    .alias("pt")
    .description("Manage project tags");

  pt.command("list")
    .description("List tags in a project")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .option("--search <text>", "Filter by label substring")
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
        let tags = [...project.tags];

        if (cmdOpts.search) {
          const search = cmdOpts.search.toLowerCase();
          tags = tags.filter((t) => t.label.toLowerCase().includes(search));
        }

        printResult(tags.map(formatTag), opts.format);
      } finally {
        conn.disconnect();
      }
    });

  pt.command("add")
    .description("Add a tag to a project")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("--label <label>", "Tag label")
    .requiredOption("--color <color>", "Tag color (hex)")
    .action(
      async (cmdOpts: { project?: string; label: string; color: string }) => {
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
          const tag = createTag(cmdOpts.label, cmdOpts.color);
          addTag(conn.handle, project.id, tag);
          await waitForSync();
          printResult(formatTag(tag), opts.format);
        } finally {
          conn.disconnect();
        }
      },
    );

  pt.command("edit")
    .description("Edit a tag")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("--tag <name-or-id>", "Tag name or ID")
    .option("--label <label>", "New label")
    .option("--color <color>", "New color (hex)")
    .action(
      async (cmdOpts: {
        project?: string;
        tag: string;
        label?: string;
        color?: string;
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
          const tag = resolveTag(project.tags, cmdOpts.tag);

          const updates: Partial<Tag> = {};
          if (cmdOpts.label !== undefined) updates.label = cmdOpts.label;
          if (cmdOpts.color !== undefined) updates.color = cmdOpts.color;

          if (Object.keys(updates).length > 0) {
            updateTag(conn.handle, project.id, tag.id, updates);
            await waitForSync();
          }

          const updatedDoc = conn.handle.doc()!;
          const updatedProject = updatedDoc.projects[project.id];
          const updatedTag = updatedProject.tags.find(
            (t) => t.id === tag.id,
          )!;
          printResult(formatTag(updatedTag), opts.format);
        } finally {
          conn.disconnect();
        }
      },
    );

  pt.command("del")
    .description("Delete a tag")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("--tag <name-or-id>", "Tag name or ID")
    .action(async (cmdOpts: { project?: string; tag: string }) => {
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
        const tag = resolveTag(project.tags, cmdOpts.tag);
        deleteTag(conn.handle, project.id, tag.id);
        await waitForSync();
        printResult(
          { deleted: true, id: tag.id, label: tag.label },
          opts.format,
        );
      } finally {
        conn.disconnect();
      }
    });
}
