import { Repo } from "@automerge/automerge-repo";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import type { DocHandle, AnyDocumentId, PeerId } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";
import type { ConnectionConfig } from "./server-api";

export type ConnectedWorkspace = {
  repo: Repo;
  handle: DocHandle<Workspace>;
  // No-op: process.exit() handles cleanup. Calling adapter.disconnect()
  // triggers automerge's throttle with a negative timeout, which emits
  // a Bun runtime warning that cannot be suppressed from JS.
  disconnect: () => void;
};

export async function connectWorkspace(
  config: ConnectionConfig,
  workspaceId: string,
  documentUrl: string,
): Promise<ConnectedWorkspace> {
  const protocol = config.tls ? "wss" : "ws";
  const url = `${protocol}://${config.host}:${config.port}/v1/sync/${workspaceId}/data?token=${encodeURIComponent(config.accessToken)}`;

  const adapter = new WebSocketClientAdapter(url);
  const repo = new Repo({
    network: [adapter],
    peerId: `cli-${crypto.randomUUID()}` as PeerId,
    sharePolicy: async () => true,
  });

  const handle = await repo.find<Workspace>(documentUrl as AnyDocumentId);

  return {
    repo,
    handle,
    disconnect: () => { /* process.exit() handles cleanup */ },
  };
}

export async function connectNewWorkspace(
  config: ConnectionConfig,
  workspaceId: string,
): Promise<ConnectedWorkspace> {
  const protocol = config.tls ? "wss" : "ws";
  const url = `${protocol}://${config.host}:${config.port}/v1/sync/${workspaceId}/data?token=${encodeURIComponent(config.accessToken)}`;

  const adapter = new WebSocketClientAdapter(url);
  const repo = new Repo({
    network: [adapter],
    peerId: `cli-${crypto.randomUUID()}` as PeerId,
    sharePolicy: async () => true,
  });

  const handle = repo.create<Workspace>();

  return {
    repo,
    handle,
    disconnect: () => { /* process.exit() handles cleanup */ },
  };
}

export function waitForSync(ms: number = 2000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
