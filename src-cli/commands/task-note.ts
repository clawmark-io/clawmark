import { Command } from "commander";
import type { ConnectionConfig } from "../lib/server-api";
import { fetchWorkspaceList } from "../lib/server-api";
import { connectWorkspace, waitForSync } from "../lib/connection";
import { resolveWorkspace, resolveProject, resolveTask } from "../lib/resolve";
import { addNote } from "@/lib/workspace/actions/notes/add-note";
import { updateNote } from "@/lib/workspace/actions/notes/update-note";
import { deleteNote } from "@/lib/workspace/actions/notes/delete-note";
import { getNotes } from "@/lib/utils/notes";
import type { TaskNote, Task } from "@/types/data-model";
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

function formatNote(n: TaskNote) {
  const result: Record<string, unknown> = {
    id: n.id,
    note: n.note,
    createdAt: n.createdAt,
  };
  if (n.updatedAt) result.updatedAt = n.updatedAt;
  return result;
}

export function registerTaskNoteCommand(program: Command): void {
  const tn = program
    .command("task-note")
    .alias("tn")
    .description("Manage task notes");

  tn.command("list")
    .description("List notes for a task")
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
        const task = project.tasks[taskRef.id] as Task;
        const notes = getNotes(task.notes);
        const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);
        printResult(sorted.map(formatNote), opts.format);
      } finally {
        conn.disconnect();
      }
    });

  tn.command("add")
    .description("Add a note to a task")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("-t, --task <name-or-id>", "Task name or ID")
    .requiredOption("--note <text>", "Note text")
    .action(
      async (cmdOpts: { project?: string; task: string; note: string }) => {
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
          const noteId = addNote(
            conn.handle,
            project.id,
            taskRef.id,
            cmdOpts.note,
          );
          await waitForSync();

          const updatedDoc = conn.handle.doc()!;
          const updatedTask = updatedDoc.projects[project.id].tasks[
            taskRef.id
          ] as Task;
          const note = getNotes(updatedTask.notes).find(
            (n) => n.id === noteId,
          );
          if (note) {
            printResult(formatNote(note), opts.format);
          }
        } finally {
          conn.disconnect();
        }
      },
    );

  tn.command("edit")
    .description("Edit a note")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("-t, --task <name-or-id>", "Task name or ID")
    .requiredOption("--note-id <id>", "Note ID")
    .requiredOption("--note <text>", "New note text")
    .action(
      async (cmdOpts: {
        project?: string;
        task: string;
        noteId: string;
        note: string;
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
          const task = project.tasks[taskRef.id] as Task;
          const existingNote = getNotes(task.notes).find(
            (n) => n.id === cmdOpts.noteId,
          );
          if (!existingNote) {
            throw new Error(`Note "${cmdOpts.noteId}" not found.`);
          }

          updateNote(
            conn.handle,
            project.id,
            taskRef.id,
            cmdOpts.noteId,
            cmdOpts.note,
          );
          await waitForSync();

          const updatedDoc = conn.handle.doc()!;
          const updatedTask = updatedDoc.projects[project.id].tasks[
            taskRef.id
          ] as Task;
          const updated = getNotes(updatedTask.notes).find(
            (n) => n.id === cmdOpts.noteId,
          );
          if (updated) {
            printResult(formatNote(updated), opts.format);
          }
        } finally {
          conn.disconnect();
        }
      },
    );

  tn.command("del")
    .description("Delete a note")
    .option("-p, --project <name-or-id>", "Project name or ID")
    .requiredOption("-t, --task <name-or-id>", "Task name or ID")
    .requiredOption("--note-id <id>", "Note ID")
    .action(
      async (cmdOpts: { project?: string; task: string; noteId: string }) => {
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
          const task = project.tasks[taskRef.id] as Task;
          const existingNote = getNotes(task.notes).find(
            (n) => n.id === cmdOpts.noteId,
          );
          if (!existingNote) {
            throw new Error(`Note "${cmdOpts.noteId}" not found.`);
          }

          deleteNote(conn.handle, project.id, taskRef.id, cmdOpts.noteId);
          await waitForSync();
          printResult(
            { deleted: true, id: cmdOpts.noteId },
            opts.format,
          );
        } finally {
          conn.disconnect();
        }
      },
    );
}
