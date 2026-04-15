export type ConnectionConfig = {
  host: string;
  port: number;
  tls: boolean;
  accessToken: string;
};

export type WorkspaceListItem = {
  workspaceId: string;
  name: string;
  documentUrl?: string;
  lastSyncedAt: string;
};

export async function fetchWorkspaceList(
  config: ConnectionConfig,
): Promise<WorkspaceListItem[]> {
  const protocol = config.tls ? "https" : "http";
  const url = `${protocol}://${config.host}:${config.port}/v1/workspaces?token=${encodeURIComponent(config.accessToken)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Server returned ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { workspaces: WorkspaceListItem[] };
  return data.workspaces;
}
