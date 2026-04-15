import { serve } from "@hono/node-server";
import { loadConfig } from "./config.js";
import { createLogger } from "./logging.js";
import { createApp, createUpgradeHandler } from "./server.js";
import { authMiddleware } from "./auth.js";
import { WorkspaceRepoManager } from "./workspace-repo.js";
import { FileWorkspaceIndexStore } from "./workspace-index/file-store.js";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { mkdirSync } from "node:fs";
import { join } from "node:path";



const banner = `
\x1b[38;2;255;140;0m  ╲   ╲   ╲\x1b[0m
\x1b[38;2;255;140;0m   ╲   ╲   ╲\x1b[0m
\x1b[38;2;255;120;0m   ╱   ╱   ╱\x1b[0m
\x1b[38;2;255;120;0m  ╱   ╱   ╱\x1b[0m
\x1b[38;2;255;100;0m  ╲   ╲   ╲\x1b[0m
\x1b[38;2;255;100;0m   ╲   ╲   ╲\x1b[38;2;0;200;255m  ╱\x1b[0m
\x1b[38;2;255;80;0m   ╱   ╱\x1b[38;2;0;200;255m ╲   ╱\x1b[0m
\x1b[38;2;255;80;0m  ╱   ╱\x1b[38;2;0;200;255m   ╲╱\x1b[0m

\x1b[38;2;255;140;0m   ██████╗\x1b[38;2;255;120;0m ██╗\x1b[38;2;255;100;0m      █████╗\x1b[38;2;255;80;0m  ██╗    ██╗\x1b[38;2;0;200;255m ███╗   ███╗\x1b[38;2;0;180;235m  █████╗\x1b[38;2;0;160;215m  ██████╗\x1b[38;2;0;140;195m  ██╗  ██╗\x1b[0m
\x1b[38;2;255;140;0m  ██╔════╝\x1b[38;2;255;120;0m ██║\x1b[38;2;255;100;0m     ██╔══██╗\x1b[38;2;255;80;0m ██║    ██║\x1b[38;2;0;200;255m ████╗ ████║\x1b[38;2;0;180;235m ██╔══██╗\x1b[38;2;0;160;215m ██╔══██╗\x1b[38;2;0;140;195m ██║ ██╔╝\x1b[0m
\x1b[38;2;255;140;0m  ██║\x1b[38;2;255;120;0m      ██║\x1b[38;2;255;100;0m     ███████║\x1b[38;2;255;80;0m ██║ █╗ ██║\x1b[38;2;0;200;255m ██╔████╔██║\x1b[38;2;0;180;235m ███████║\x1b[38;2;0;160;215m ██████╔╝\x1b[38;2;0;140;195m █████╔╝\x1b[0m
\x1b[38;2;255;140;0m  ██║\x1b[38;2;255;120;0m      ██║\x1b[38;2;255;100;0m     ██╔══██║\x1b[38;2;255;80;0m ██║███╗██║\x1b[38;2;0;200;255m ██║╚██╔╝██║\x1b[38;2;0;180;235m ██╔══██║\x1b[38;2;0;160;215m ██╔══██╗\x1b[38;2;0;140;195m ██╔═██╗\x1b[0m
\x1b[38;2;255;140;0m  ╚██████╗\x1b[38;2;255;120;0m ███████╗\x1b[38;2;255;100;0m██║  ██║\x1b[38;2;255;80;0m ╚███╔███╔╝\x1b[38;2;0;200;255m ██║ ╚═╝ ██║\x1b[38;2;0;180;235m ██║  ██║\x1b[38;2;0;160;215m ██║  ██║\x1b[38;2;0;140;195m ██║  ██╗\x1b[0m
\x1b[38;2;255;140;0m   ╚═════╝\x1b[38;2;255;120;0m ╚══════╝\x1b[38;2;255;100;0m╚═╝  ╚═╝\x1b[38;2;255;80;0m  ╚══╝╚══╝\x1b[38;2;0;200;255m  ╚═╝     ╚═╝\x1b[38;2;0;180;235m ╚═╝  ╚═╝\x1b[38;2;0;160;215m ╚═════╝\x1b[38;2;0;140;195m  ╚═╝  ╚═╝\x1b[0m
  Open Source Sync Server  \x1b[38;2;100;100;120m│  \x1b[38;2;180;180;200mv1.0.0\x1b[0m  \x1b[38;2;100;100;120m│\x1b[0m  \x1b[38;2;0;200;255m✓ Ready\x1b[0m  \x1b[38;2;100;100;120m│\x1b[0m  \x1b[38;2;255;140;0m🔥 Tearing through tasks\x1b[0m
\x1b[38;2;120;120;140m ─────────────────────────────────────────────────────────────────────────────\x1b[0m
\x1b[38;2;100;100;100m      remember to visit https://clawmark.io for latest news and updates\x1b[0m
`;
//\x1b[38;2;180;180;200m   v1.0.0\x1b[0m  \x1b[38;2;100;100;120m│\x1b[0m  \x1b[38;2;0;200;255m✓ Ready\x1b[0m  \x1b[38;2;100;100;120m│\x1b[0m  \x1b[38;2;255;140;0m🔥 Tearing through tasks\x1b[0m

function printBanner(options: { version?: string; port?: number; host?: string } = {}) {
  const { version = '1.0.0', port, host } = options;

  let output = banner;

  if (version !== '1.0.0') {
    output = output.replace('v1.0.0', `v${version}`);
  }

  console.log(output);

  if (port) {
    const url = `http://${host || 'localhost'}:${port}`;
    console.log(`\x1b[38;2;0;200;55m   🌐 Listening on \x1b[38;2;255;140;0m${url}\x1b[0m\n`);
  }
}


const config = loadConfig();
const logger = createLogger(config.accessToken);

// Ensure storage directories exist
mkdirSync(config.storagePath, { recursive: true });
mkdirSync(join(config.storagePath, "backups"), { recursive: true });
mkdirSync(join(config.storagePath, "workspaces"), { recursive: true });

const indexStore = new FileWorkspaceIndexStore(
  config.storagePath,
  config.workspaceIndex.maxBackups,
  logger,
);
const repoManager = new WorkspaceRepoManager(config.storagePath, indexStore, logger);
const auth = authMiddleware(config.accessToken, logger);
const app = createApp(auth, logger, indexStore, repoManager);

// Debug: dump all workspace documents from the index on startup
// await repoManager.dumpAllWorkspaces();

// Run image GC on startup to clean orphaned files
await repoManager.runImageGc();

// Schedule periodic image GC
const gcIntervalMs = config.imageGc.intervalHours * 60 * 60 * 1000;
setInterval(() => {
  repoManager.runImageGc().catch((err) => {
    logger.warn(`Periodic image GC failed: ${err}`);
  });
}, gcIntervalMs);

const server = serve(
  { fetch: app.fetch, port: config.port, hostname: config.host },
  (info) => {
    logger.info(`Sync server listening on ${info.address}:${info.port}`);
    // Run directly
    printBanner({
      host: info.address,
      port: info.port,
    });
  },
);

// Handle WebSocket upgrades outside of Hono
const upgradeHandler = createUpgradeHandler(logger, repoManager);
server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token || token !== config.accessToken) {
    logger.warn(`WS auth failed for ${url.pathname}`);
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  upgradeHandler(request, socket, head);
});


