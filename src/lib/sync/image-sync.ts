import type { SyncServerConfig } from "@/types/sync";
import type { Project } from "@/types/data-model";
import { loadImageAsBlob, removeImage, imageExists } from "@/lib/utils/opfs.ts";
import { enqueueImagePuts, getEntriesForServer, removeEntry } from "./image-queue";
import type { ImageQueueEntry } from "./image-queue";

function buildImageBaseUrl(config: SyncServerConfig, wsId: string): string {
  const protocol = config.useTls ? "https" : "http";
  return `${protocol}://${config.host}:${config.port}/v1/sync/${wsId}/images`;
}

export async function uploadImageToServer(
  config: SyncServerConfig,
  wsId: string,
  uuid: string,
  blob: Blob,
): Promise<boolean> {
  try {
    const url = `${buildImageBaseUrl(config, wsId)}/${uuid}?token=${encodeURIComponent(config.accessToken)}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": blob.type || "application/octet-stream" },
      body: blob,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function downloadImageFromServer(
  config: SyncServerConfig,
  wsId: string,
  uuid: string,
): Promise<Blob | null> {
  try {
    const url = `${buildImageBaseUrl(config, wsId)}/${uuid}?token=${encodeURIComponent(config.accessToken)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

export async function fetchServerInventory(
  config: SyncServerConfig,
  wsId: string,
): Promise<string[]> {
  try {
    const url = `${buildImageBaseUrl(config, wsId)}?token=${encodeURIComponent(config.accessToken)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.images ?? [];
  } catch {
    return [];
  }
}

/** Enqueue PUT for a UUID to all configured sync servers for the workspace */
export async function enqueueImageForAllServers(wsId: string, uuid: string, servers?: SyncServerConfig[]): Promise<void> {
  if (!servers || servers.length === 0) return;
  const entries: ImageQueueEntry[] = servers.map((s) => ({
    type: "put" as const,
    workspaceId: wsId,
    serverId: s.id,
    uuid,
  }));
  await enqueueImagePuts(entries);
}

/** Flush pending image uploads for a specific server */
export async function flushImageQueue(wsId: string, config: SyncServerConfig): Promise<void> {
  const entries = await getEntriesForServer(wsId, config.id);
  for (const entry of entries) {
    // eslint-disable-next-line no-await-in-loop -- sequential uploads to avoid overwhelming the server
    const blob = await loadImageAsBlob(wsId, entry.uuid);
    if (!blob) {
      // File no longer exists in OPFS (replaced/removed while offline) — drop entry
      // eslint-disable-next-line no-await-in-loop -- sequential: must remove before continuing
      await removeEntry(entry);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop -- sequential uploads to avoid overwhelming the server
    const success = await uploadImageToServer(config, wsId, entry.uuid, blob);
    if (success) {
      // eslint-disable-next-line no-await-in-loop -- sequential: remove entry after confirmed upload
      await removeEntry(entry);
    }
    // On failure: leave in queue for next attempt
  }
}

/** Reconciliation: ensure server has all referenced images (§6) */
export async function reconcileImages(
  wsId: string,
  config: SyncServerConfig,
  referencedUuids: Set<string>,
): Promise<void> {
  const serverUuids = await fetchServerInventory(config, wsId);
  const presentSet = new Set(serverUuids);

  const missingUuids = [...referencedUuids].filter((uuid) => !presentSet.has(uuid));
  const existsResults = await Promise.all(
    missingUuids.map(async (uuid) => ({ uuid, exists: await imageExists(wsId, uuid) })),
  );
  const entries: ImageQueueEntry[] = existsResults
    .filter((r) => r.exists)
    .map((r) => ({ type: "put" as const, workspaceId: wsId, serverId: config.id, uuid: r.uuid }));
  if (entries.length > 0) {
    await enqueueImagePuts(entries);
    await flushImageQueue(wsId, config);
  }
}

/** Collect all referenced image UUIDs from projects */
export function collectReferencedUuids(projects: Record<string, Project>): Set<string> {
  const uuids = new Set<string>();
  for (const project of Object.values(projects)) {
    if (project.backgroundVersion) uuids.add(project.backgroundVersion);
    if (project.logoVersion) uuids.add(project.logoVersion);
  }
  return uuids;
}

/** Check if an image UUID is still referenced by any project */
export function isImageReferenced(
  uuid: string,
  projects: Record<string, Project>,
): boolean {
  for (const project of Object.values(projects)) {
    if (project.backgroundVersion === uuid || project.logoVersion === uuid) return true;
  }
  return false;
}

/** Delete an OPFS image only if no project still references it */
export async function gcImageIfUnreferenced(
  wsId: string,
  uuid: string,
  projects: Record<string, Project>,
): Promise<void> {
  if (!isImageReferenced(uuid, projects)) {
    await removeImage(wsId, uuid);
  }
}
