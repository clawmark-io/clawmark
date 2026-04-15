import { parseJsonExport } from "./json-schema";
import { saveImage } from "@/lib/utils/opfs.ts";
import { enqueueImageForAllServers } from "@/lib/sync/image-sync";
import { sanitizeTagLabel } from "@/lib/data-model";
import { generateId } from "@/lib/utils/id";
import type { Project, ThemeSettings, WorkspaceDefaultView } from "@/types/data-model";

export type JsonImportStats = {
  projectCount: number;
  totalTasks: number;
  totalColumns: number;
  logosImported: number;
  backgroundsImported: number;
};

export type JsonImportResult =
  | { success: true; projects: Project[]; stats: JsonImportStats; workspaceMeta?: { name: string; theme: ThemeSettings; defaultView?: WorkspaceDefaultView } }
  | { success: false; error: string };

function dataUrlToFile(dataUrl: string, name: string): File | null {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const b64 = match[2];
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], name, { type: mime });
  } catch {
    return null;
  }
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "png";
}

export async function processJsonFile(workspaceId: string, file: File): Promise<JsonImportResult> {
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    const parsed = parseJsonExport(raw);

    if (parsed.type === "error") {
      return { success: false, error: parsed.message };
    }

    const { projects, images, workspace } = parsed.data;

    for (const project of projects) {
      for (const tag of project.tags) {
        tag.label = sanitizeTagLabel(tag.label);
      }
    }
    const workspaceMeta = workspace
      ? { name: workspace.name, theme: workspace.theme as ThemeSettings, defaultView: workspace.defaultView }
      : undefined;

    const stats: JsonImportStats = {
      projectCount: projects.length,
      totalTasks: projects.reduce((sum, p) => sum + Object.keys(p.tasks).length, 0),
      totalColumns: projects.reduce((sum, p) => sum + p.columns.length, 0),
      logosImported: 0,
      backgroundsImported: 0,
    };

    if (images) {
      const imageResults = await Promise.allSettled(
        projects.map(async (project) => {
          const projectImages = images[project.id];
          if (!projectImages) return { logos: 0, backgrounds: 0 };

          let logos = 0;
          let backgrounds = 0;

          if (projectImages.logo) {
            const ext = extFromMime(projectImages.logo.match(/^data:([^;]+)/)?.[1] ?? "");
            const logoFile = dataUrlToFile(projectImages.logo, `logo.${ext}`);
            if (logoFile) {
              try {
                const logoUuid = generateId();
                await saveImage(workspaceId, logoUuid, logoFile);
                project.logoVersion = logoUuid;
                project.logoMimeType = logoFile.type || "image/png";
                enqueueImageForAllServers(workspaceId, logoUuid);
                logos++;
              } catch {
                // Skip failed image import
              }
            }
          }

          if (projectImages.background) {
            const ext = extFromMime(projectImages.background.match(/^data:([^;]+)/)?.[1] ?? "");
            const bgFile = dataUrlToFile(projectImages.background, `bg.${ext}`);
            if (bgFile) {
              try {
                const bgUuid = generateId();
                await saveImage(workspaceId, bgUuid, bgFile);
                project.backgroundVersion = bgUuid;
                project.backgroundMimeType = bgFile.type || "image/png";
                enqueueImageForAllServers(workspaceId, bgUuid);
                backgrounds++;
              } catch {
                // Skip failed image import
              }
            }
          }

          return { logos, backgrounds };
        }),
      );

      for (const result of imageResults) {
        if (result.status === "fulfilled") {
          stats.logosImported += result.value.logos;
          stats.backgroundsImported += result.value.backgrounds;
        }
      }
    }

    return { success: true, projects, stats, workspaceMeta };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { success: false, error: "Invalid JSON file" };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
