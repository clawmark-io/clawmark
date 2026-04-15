import type { FilesystemDriver } from "./types.ts";

/**
 * FilesystemDriver backed by OPFS (Origin Private File System).
 * Wraps the raw OPFS API into the driver interface.
 */

async function getDir(workspaceId: string, subdirectory: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const workspaceDir = await root.getDirectoryHandle(workspaceId, { create: true });
  return workspaceDir.getDirectoryHandle(subdirectory, { create: true });
}

function parsePath(path: string): { directory: string; filename: string } {
  const parts = path.split("/");
  const filename = parts.pop()!;
  const directory = parts.join("/") || "files";
  return { directory, filename };
}

export function createOPFSDriver(): FilesystemDriver {
  return {
    async write(workspaceId, path, data) {
      const { directory, filename } = parsePath(path);
      const dir = await getDir(workspaceId, directory);
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
    },

    async read(workspaceId, path) {
      try {
        const { directory, filename } = parsePath(path);
        const dir = await getDir(workspaceId, directory);
        const fileHandle = await dir.getFileHandle(filename);
        return await fileHandle.getFile();
      } catch {
        return null;
      }
    },

    async readAsDataUrl(workspaceId, path) {
      try {
        const { directory, filename } = parsePath(path);
        const dir = await getDir(workspaceId, directory);
        const fileHandle = await dir.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
        );
        return `data:${file.type};base64,${base64}`;
      } catch {
        return null;
      }
    },

    async remove(workspaceId, path) {
      try {
        const { directory, filename } = parsePath(path);
        const dir = await getDir(workspaceId, directory);
        await dir.removeEntry(filename);
      } catch {
        // File may not exist
      }
    },

    async exists(workspaceId, path) {
      try {
        const { directory, filename } = parsePath(path);
        const dir = await getDir(workspaceId, directory);
        await dir.getFileHandle(filename);
        return true;
      } catch {
        return false;
      }
    },

    async removeDirectory(workspaceId, directory) {
      try {
        const root = await navigator.storage.getDirectory();
        if (directory === "") {
          // Remove entire workspace directory
          await root.removeEntry(workspaceId, { recursive: true });
        } else {
          const workspaceDir = await root.getDirectoryHandle(workspaceId);
          await workspaceDir.removeEntry(directory, { recursive: true });
        }
      } catch {
        // Directory may not exist
      }
    },
  };
}
