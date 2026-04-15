import { Hono } from "hono";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { Logger } from "./logging.js";
import type { WorkspaceRepoManager } from "./workspace-repo.js";
import type { WorkspaceIndexStore } from "./workspace-index/types.js";
import {
  listWorkspaces,
  putImage,
  getImage,
  getImageList,
  toResponse,
  handleWorkspaceUpgrade,
  SYNC_PATH_REGEX,
  type SyncStorage,
} from "./routes.js";

export function createApp(
  auth: MiddlewareHandler,
  logger: Logger,
  indexStore: WorkspaceIndexStore,
  repoManager: WorkspaceRepoManager,
) {
  const app = new Hono();

  app.use("*", cors());

  // Build storage once — single-user server, one root path
  const storage: SyncStorage = {
    repoManager,
    indexStore,
    putImage: (wsId, uuid, data) => repoManager.putImage(wsId, uuid, data),
    getImage: (wsId, uuid) => repoManager.getImage(wsId, uuid),
    listImages: (wsId) => repoManager.listImages(wsId),
  };

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.get("/v1/workspaces", auth, async (c) =>
    toResponse(c, await listWorkspaces(storage)),
  );

  app.put("/v1/sync/:wsId/images/:uuid", auth, async (c) =>
    toResponse(
      c,
      await putImage(
        storage,
        logger,
        c.req.param("wsId"),
        c.req.param("uuid"),
        await c.req.arrayBuffer(),
      ),
    ),
  );

  app.get("/v1/sync/:wsId/images/:uuid", auth, async (c) =>
    toResponse(
      c,
      await getImage(storage, c.req.param("wsId"), c.req.param("uuid")),
    ),
  );

  app.get("/v1/sync/:wsId/images", auth, async (c) =>
    toResponse(c, getImageList(storage, c.req.param("wsId"))),
  );

  return app;
}

export function createUpgradeHandler(
  logger: Logger,
  repoManager: WorkspaceRepoManager,
) {
  return (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const match = url.pathname.match(SYNC_PATH_REGEX);
    if (!match) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    handleWorkspaceUpgrade(
      logger,
      repoManager,
      match[1],
      request,
      socket,
      head,
    );
  };
}
