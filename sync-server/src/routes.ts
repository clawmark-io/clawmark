import { Readable } from "node:stream";
import type { ReadStream } from "node:fs";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { WorkspaceRepoManager } from "./workspace-repo.js";
import type { WorkspaceIndexStore } from "./workspace-index/types.js";
import type { Logger } from "./logging.js";

export const SYNC_PATH_REGEX = /^\/v1\/sync\/([^/]+)\/data$/;
const IMAGE_ID_REGEX =
  /^[0-9a-z-]{1,64}$/i;

export type SyncStorage = {
  repoManager: WorkspaceRepoManager;
  indexStore: WorkspaceIndexStore;
  putImage(wsId: string, uuid: string, data: Buffer): Promise<void>;
  getImage(wsId: string, uuid: string): Promise<ReadStream | null>;
  listImages(wsId: string): string[];
};

// ── Route handler return types ───────────────────────────────────────

type JsonResult = { json: unknown; status?: number };
type StreamResult = { stream: ReadableStream; status?: number };
type EmptyResult = { status: number };
type ErrorResult = { error: string; status: number };

export type RouteResult = JsonResult | StreamResult | EmptyResult | ErrorResult;

// ── Route handlers ───────────────────────────────────────────────────

export async function listWorkspaces(
  storage: SyncStorage,
): Promise<JsonResult> {
  const { repoManager, indexStore } = storage;

  // Ensure index is up to date by scanning all active repos
  for (const id of repoManager.getWorkspaceIds()) {
    await repoManager.updateIndex(id);
  }

  const workspaces = await indexStore.getAll();
  return { json: { workspaces } };
}

export async function putImage(
  storage: SyncStorage,
  log: Logger,
  wsId: string,
  uuid: string,
  body: ArrayBuffer,
): Promise<EmptyResult | ErrorResult> {
  if (!IMAGE_ID_REGEX.test(uuid)) {
    return { error: "Invalid image ID", status: 400 };
  }
  if (body.byteLength === 0) {
    return { error: "Empty body", status: 400 };
  }

  await storage.putImage(wsId, uuid, Buffer.from(body));
  log.info(
    `Image PUT: ${uuid} for workspace ${wsId} (${body.byteLength} bytes)`,
  );
  return { status: 200 };
}

export async function getImage(
  storage: SyncStorage,
  wsId: string,
  uuid: string,
): Promise<StreamResult | ErrorResult> {
  if (!IMAGE_ID_REGEX.test(uuid)) {
    return { error: "Invalid image ID", status: 400 };
  }

  const stream = await storage.getImage(wsId, uuid);
  if (!stream) {
    return { error: "Not found", status: 404 };
  }

  return { stream: Readable.toWeb(stream) as ReadableStream };
}

export function getImageList(
  storage: SyncStorage,
  wsId: string,
): JsonResult {
  const images = storage.listImages(wsId);
  return { json: { images } };
}

// ── Hono response helper ─────────────────────────────────────────────

/**
 * Convert a RouteResult into a Hono Response.
 * Works with any Hono context regardless of package version.
 */
export function toResponse(
  c: { json(data: unknown, status?: number): Response; body(data: ReadableStream | null, status?: number, headers?: Record<string, string>): Response },
  result: RouteResult,
): Response {
  if ("error" in result) {
    return c.json({ error: result.error }, result.status);
  }
  if ("json" in result) {
    return c.json(result.json, result.status);
  }
  if ("stream" in result) {
    return c.body(result.stream, result.status ?? 200, {
      "Content-Type": "application/octet-stream",
    });
  }
  return c.body(null, result.status);
}

// ── WebSocket upgrade ────────────────────────────────────────────────

/**
 * Core WebSocket upgrade logic for workspace sync.
 * Call after auth and route matching are done.
 */
export function handleWorkspaceUpgrade(
  logger: Logger,
  repoManager: WorkspaceRepoManager,
  workspaceId: string,
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
) {
  repoManager
    .getOrCreate(workspaceId)
    .then(({ wss: workspaceWss }) => {
      if (socket.destroyed) return;

      logger.info(`WS upgrade: workspace=${workspaceId}`);

      workspaceWss.handleUpgrade(request, socket, head, (ws) => {
        workspaceWss.emit("connection", ws, request);
        logger.info(`WS connected: workspace=${workspaceId}`);

        // Update workspace index after initial sync settles
        setTimeout(() => {
          repoManager.updateIndex(workspaceId).catch((err) => {
            logger.warn(
              `Failed to update index for workspace ${workspaceId}: ${err}`,
            );
          });
        }, 3000);

        ws.on("close", () => {
          logger.info(`WS disconnected: workspace=${workspaceId}`);
          repoManager.updateIndex(workspaceId).catch((err) => {
            logger.warn(
              `Failed to update index for workspace ${workspaceId}: ${err}`,
            );
          });
        });
      });
    })
    .catch((err) => {
      logger.warn(`Failed to initialize workspace ${workspaceId}: ${err}`);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    });
}
