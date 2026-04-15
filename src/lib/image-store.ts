import type { FilesystemDriver } from "@/lib/workspace/drivers/types";
import type { SyncServerConfig } from "@/types/sync";
import type { Project } from "@/types/data-model";
import {
  enqueueImageForAllServers,
  downloadImageFromServer,
  gcImageIfUnreferenced as gcImageIfUnreferencedFn,
  flushImageQueue,
  reconcileImages as reconcileImagesFn,
  collectReferencedUuids,
} from "@/lib/sync/image-sync";

export class ImageStore {
  constructor(
    private workspaceId: string,
    private fs: FilesystemDriver,
    private getServerConfigs: () => SyncServerConfig[],
  ) {}

  async save(imageId: string, blob: Blob): Promise<void> {
    await this.fs.write(this.workspaceId, `images/${imageId}`, blob);
  }

  async load(imageId: string): Promise<string | null> {
    const blob = await this.fs.read(this.workspaceId, `images/${imageId}`);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  async loadAsBlob(imageId: string): Promise<Blob | null> {
    return this.fs.read(this.workspaceId, `images/${imageId}`);
  }

  async loadAsDataUrl(imageId: string): Promise<string | null> {
    return this.fs.readAsDataUrl(this.workspaceId, `images/${imageId}`);
  }

  async remove(imageId: string): Promise<void> {
    await this.fs.remove(this.workspaceId, `images/${imageId}`);
  }

  async exists(imageId: string): Promise<boolean> {
    return this.fs.exists(this.workspaceId, `images/${imageId}`);
  }

  async removeAll(): Promise<void> {
    await this.fs.removeDirectory(this.workspaceId, "images");
  }

  /**
   * Try loading from local FS, then fall back to each sync server.
   * Returns a blob URL on success, null on failure.
   */
  async loadOrFetch(imageId: string): Promise<string | null> {
    const url = await this.load(imageId);
    if (url) return url;

    // Not found locally — try downloading from sync servers
    const servers = this.getServerConfigs();
    for (const config of servers) {
      // eslint-disable-next-line no-await-in-loop -- sequential: try servers one by one, stop on first success
      const blob = await downloadImageFromServer(config, this.workspaceId, imageId);
      if (blob) {
        // eslint-disable-next-line no-await-in-loop -- sequential: save must complete before returning
        await this.save(imageId, blob);
        window.dispatchEvent(new CustomEvent("image-synced", { detail: { uuid: imageId } }));
        return this.load(imageId);
      }
    }
    return null;
  }

  /** Enqueue image for upload to all configured servers */
  async syncEnqueue(imageId: string): Promise<void> {
    await enqueueImageForAllServers(this.workspaceId, imageId, this.getServerConfigs());
  }

  /** Flush pending uploads for a specific server */
  async flush(config: SyncServerConfig): Promise<void> {
    await flushImageQueue(this.workspaceId, config);
  }

  /** Reconcile: ensure server has all referenced images */
  async reconcile(config: SyncServerConfig, projects: Record<string, Project>): Promise<void> {
    const referencedUuids = collectReferencedUuids(projects);
    await reconcileImagesFn(this.workspaceId, config, referencedUuids);
  }

  /** Delete image from local FS only if no project still references it */
  async gcIfUnreferenced(uuid: string, projects: Record<string, Project>): Promise<void> {
    await gcImageIfUnreferencedFn(this.workspaceId, uuid, projects);
  }
}
