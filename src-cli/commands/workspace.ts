import { Command } from "commander";
import type { ConnectionConfig } from "../lib/server-api";
import { fetchWorkspaceList } from "../lib/server-api";
import { connectNewWorkspace, connectWorkspace, waitForSync } from "../lib/connection";
import { resolveWorkspace } from "../lib/resolve";
import { createWorkspace } from "@/lib/data-model";
import { updateWorkspaceName } from "@/lib/workspace/actions/theme/update-workspace-name";
import { generateId } from "@/lib/utils/id";
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

export function registerWorkspaceCommand(program: Command): void {
  const ws = program
    .command("workspace")
    .alias("ws")
    .description("Manage workspaces");

  ws.command("list")
    .description("List all workspaces on the sync server")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const config = getConfig(opts);
      const workspaces = await fetchWorkspaceList(config);
      printResult(
        workspaces.map((w) => ({
          id: w.workspaceId,
          name: w.name,
          lastSyncedAt: w.lastSyncedAt,
        })),
        opts.format,
      );
    });

  ws.command("add")
    .description("Create a new workspace")
    .requiredOption("--name <name>", "Workspace name")
    .action(async (cmdOpts: { name: string }) => {
      const opts = program.opts<GlobalOpts>();
      const config = getConfig(opts);
      const workspaceId = generateId();

      const conn = await connectNewWorkspace(config, workspaceId);
      try {
        const data = createWorkspace(cmdOpts.name);
        conn.handle.change((doc) => {
          Object.assign(doc, data);
        });
        await waitForSync();
        printResult({ id: workspaceId, name: cmdOpts.name }, opts.format);
      } finally {
        conn.disconnect();
      }
    });

  ws.command("edit")
    .description("Edit a workspace")
    .option("--name <name>", "New workspace name")
    .action(async (cmdOpts: { name?: string }) => {
      const opts = program.opts<GlobalOpts>();
      if (!opts.workspace) {
        throw new Error("-w/--workspace is required for workspace edit");
      }
      const config = getConfig(opts);
      const workspaces = await fetchWorkspaceList(config);
      const ws = resolveWorkspace(workspaces, opts.workspace);
      if (!ws.documentUrl) throw new Error("Workspace has no document URL.");

      const conn = await connectWorkspace(config, ws.workspaceId, ws.documentUrl);
      try {
        if (cmdOpts.name) {
          updateWorkspaceName(conn.handle, cmdOpts.name);
        }
        await waitForSync();
        const doc = conn.handle.doc()!;
        printResult({ id: doc.id, name: doc.name }, opts.format);
      } finally {
        conn.disconnect();
      }
    });
}
