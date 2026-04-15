import type { FilesystemDriver } from "./types.ts";

const WORKSPACES_ROOT = "workspaces";

function workspacePath(workspaceId: string, path: string): string {
  return `${WORKSPACES_ROOT}/${workspaceId}/${path}`;
}

function metadataPath(path: string): string {
  return `${path}.meta.json`;
}

function parentDirectory(path: string): string {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

function toDataUrl(blob: Blob, buffer: ArrayBuffer): string {
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
  );
  return `data:${blob.type || "application/octet-stream"};base64,${base64}`;
}

async function readMimeType(path: string): Promise<string> {
  const { BaseDirectory, readFile } = await import("@tauri-apps/plugin-fs");
  try {
    const bytes = await readFile(metadataPath(path), { baseDir: BaseDirectory.AppData });
    const text = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(text) as { type?: unknown };
    return typeof parsed.type === "string" ? parsed.type : "";
  } catch {
    return "";
  }
}

async function writeMimeType(path: string, mimeType: string): Promise<void> {
  const { BaseDirectory, remove, writeFile } = await import("@tauri-apps/plugin-fs");
  const metaPath = metadataPath(path);

  if (!mimeType) {
    try {
      await remove(metaPath, { baseDir: BaseDirectory.AppData });
    } catch {
      // Metadata file may not exist
    }
    return;
  }

  const metadata = new TextEncoder().encode(JSON.stringify({ type: mimeType }));
  await writeFile(metaPath, metadata, { baseDir: BaseDirectory.AppData });
}

export function createTauriFSDriver(): FilesystemDriver {
  return {
    async write(workspaceId, path, data) {
      const { BaseDirectory, mkdir, writeFile } = await import("@tauri-apps/plugin-fs");
      const filePath = workspacePath(workspaceId, path);
      const dirPath = parentDirectory(filePath);

      await mkdir(dirPath, { baseDir: BaseDirectory.AppData, recursive: true });
      await writeFile(filePath, new Uint8Array(await data.arrayBuffer()), {
        baseDir: BaseDirectory.AppData,
      });
      await writeMimeType(filePath, data.type);
    },

    async read(workspaceId, path) {
      const { BaseDirectory, readFile } = await import("@tauri-apps/plugin-fs");
      const filePath = workspacePath(workspaceId, path);

      try {
        const [bytes, mimeType] = await Promise.all([
          readFile(filePath, { baseDir: BaseDirectory.AppData }),
          readMimeType(filePath),
        ]);
        return new Blob([bytes], mimeType ? { type: mimeType } : undefined);
      } catch {
        return null;
      }
    },

    async readAsDataUrl(workspaceId, path) {
      const blob = await this.read(workspaceId, path);
      if (!blob) return null;
      return toDataUrl(blob, await blob.arrayBuffer());
    },

    async remove(workspaceId, path) {
      const { BaseDirectory, remove } = await import("@tauri-apps/plugin-fs");
      const filePath = workspacePath(workspaceId, path);

      try {
        await remove(filePath, { baseDir: BaseDirectory.AppData });
      } catch {
        // File may not exist
      }

      try {
        await remove(metadataPath(filePath), { baseDir: BaseDirectory.AppData });
      } catch {
        // Metadata file may not exist
      }
    },

    async exists(workspaceId, path) {
      const { BaseDirectory, exists } = await import("@tauri-apps/plugin-fs");
      return exists(workspacePath(workspaceId, path), { baseDir: BaseDirectory.AppData });
    },

    async removeDirectory(workspaceId, directory) {
      const { BaseDirectory, remove } = await import("@tauri-apps/plugin-fs");
      const target = directory === ""
        ? `${WORKSPACES_ROOT}/${workspaceId}`
        : workspacePath(workspaceId, directory);

      try {
        await remove(target, { baseDir: BaseDirectory.AppData, recursive: true });
      } catch {
        // Directory may not exist
      }
    },
  };
}