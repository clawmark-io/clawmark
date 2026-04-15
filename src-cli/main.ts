import { Command } from "commander";
import { registerWorkspaceCommand } from "./commands/workspace";
import { registerProjectCommand } from "./commands/project";
import { registerProjectTagCommand } from "./commands/project-tag";
import { registerProjectColumnCommand } from "./commands/project-column";
import { registerTaskCommand } from "./commands/task";
import { registerTaskNoteCommand } from "./commands/task-note";
import { printError } from "./lib/output";
import type { OutputFormat } from "./lib/output";

// Automerge-repo's throttle can pass a negative delay to setTimeout, which
// triggers an uncatchable native warning in Bun. Clamp to 0 to prevent it.
const _origSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
  return _origSetTimeout(fn, Math.max(0, ms ?? 0), ...args);
}) as typeof globalThis.setTimeout;

const program = new Command();

const envTls = process.env.CLAWMARK_SYNC_TLS;

program
  .name("clawmark")
  .description("CLI for Clawmark task management")
  .version("0.1.0")
  .option("--host <ip>", "Sync server host", process.env.CLAWMARK_SYNC_HOST ?? "localhost")
  .option("--port <number>", "Sync server port", process.env.CLAWMARK_SYNC_PORT ?? "3030")
  .option("--tls", "Use TLS", envTls === "true" || envTls === "1")
  .option("--key <token>", "Access key", process.env.CLAWMARK_SYNC_KEY)
  .option("--format <format>", "Output format: json or yaml", "json")
  .option("-w, --workspace <name-or-id>", "Target workspace", process.env.CLAWMARK_WORKSPACE)
  .option("--project <name-or-id>", "Default project", process.env.CLAWMARK_PROJECT);

// Parse port as number and validate key after Commander processes options
program.hook("preAction", () => {
  const opts = program.opts();
  opts.port = parseInt(opts.port, 10);
  if (!opts.key) {
    throw new Error("--key is required (or set CLAWMARK_SYNC_KEY)");
  }
});

registerWorkspaceCommand(program);
registerProjectCommand(program);
registerProjectTagCommand(program);
registerProjectColumnCommand(program);
registerTaskCommand(program);
registerTaskNoteCommand(program);

async function main() {
  try {
    await program.parseAsync(process.argv);
    process.exit(0);
  } catch (err) {
    const opts = program.opts();
    const format = (opts.format as OutputFormat) || "json";
    printError(err, format);
    process.exit(1);
  }
}

main();
