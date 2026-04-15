import { isTauri } from "@tauri-apps/api/core";
import { generateId } from "@/lib/utils/id";
import { parseKanriExport } from "./kanri-schema";
import { convertKanriExport } from "./kanri-converter";
import { saveImage } from "@/lib/utils/opfs.ts";
import { enqueueImageForAllServers } from "@/lib/sync/image-sync";
import type { ConversionResult, ImportStats } from "./kanri-converter";
import type { Project } from "@/types/data-model";
import type { ThemeName } from "@/types/theme";

export type ImportResult =
  | { success: true; projects: Project[]; stats: ImportStats; suggestedTheme: ThemeName | null }
  | { success: false; error: string };

async function tryImportBackground(workspaceId: string, src: string): Promise<{ uuid: string; mimeType: string } | null> {
  try {
    if (!isTauri()) return null;
    const { readFile } = await import("@tauri-apps/plugin-fs");
    const bytes = await readFile(src);
    const ext = src.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
    };
    const mime = mimeMap[ext] ?? "image/jpeg";
    const bgUuid = generateId();
    const file = new File([bytes], `bg.${ext}`, { type: mime });
    await saveImage(workspaceId, bgUuid, file);
    return { uuid: bgUuid, mimeType: mime };
  } catch {
    return null;
  }
}

export async function processKanriFile(workspaceId: string, file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    const parsed = parseKanriExport(raw);

    if (parsed.type === "error") {
      return { success: false, error: parsed.message };
    }

    const result: ConversionResult = convertKanriExport(parsed);

    const importResults = await Promise.all(
      result.imported.map(async (item) => {
        if (!item.backgroundSrc) return false;
        const imported = await tryImportBackground(workspaceId, item.backgroundSrc);
        if (imported) {
          item.project.backgroundVersion = imported.uuid;
          item.project.backgroundMimeType = imported.mimeType;
          enqueueImageForAllServers(workspaceId, imported.uuid);
          return true;
        }
        return false;
      }),
    );
    result.stats.backgroundsImported = importResults.filter(Boolean).length;

    const projects = result.imported.map((i) => i.project);

    return {
      success: true,
      projects,
      stats: result.stats,
      suggestedTheme: result.suggestedTheme,
    };
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
