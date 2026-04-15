import type { Project, ThemeSettings, WorkspaceDefaultView } from "@/types/data-model";
import { loadImageAsDataUrl } from "@/lib/utils/opfs.ts";

type ProjectImages = {
  logo: string | null;
  background: string | null;
};

type JsonExportPayload = {
  version: 1;
  exportedAt: string;
  workspace?: {
    name: string;
    theme: ThemeSettings;
    defaultView?: WorkspaceDefaultView;
  };
  projects: Project[];
  images?: Record<string, ProjectImages>;
};

async function collectImages(
  workspaceId: string,
  projects: Project[],
): Promise<Record<string, ProjectImages>> {
  const entries = await Promise.all(
    projects.map(async (project) => {
      const [logo, background] = await Promise.all([
        project.logoVersion
          ? loadImageAsDataUrl(workspaceId, project.logoVersion)
          : null,
        project.backgroundVersion
          ? loadImageAsDataUrl(workspaceId, project.backgroundVersion)
          : null,
      ]);
      return [project.id, { logo, background }] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function buildJsonExport(
  projects: Project[],
  workspaceMeta?: { name: string; theme: ThemeSettings; defaultView?: WorkspaceDefaultView },
): JsonExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...(workspaceMeta ? { workspace: workspaceMeta } : {}),
    projects,
  };
}

export async function buildJsonExportWithImages(
  workspaceId: string,
  projects: Project[],
  workspaceMeta?: { name: string; theme: ThemeSettings; defaultView?: WorkspaceDefaultView },
): Promise<JsonExportPayload> {
  const images = await collectImages(workspaceId, projects);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...(workspaceMeta ? { workspace: workspaceMeta } : {}),
    projects,
    images,
  };
}
