import { isTauri } from "@tauri-apps/api/core";
import { createOPFSDriver } from "./opfs-driver.ts";
import { createTauriFSDriver } from "./tauri-fs-driver.ts";
import type { FilesystemDriver } from "./types.ts";

let filesystemDriver: FilesystemDriver | null = null;

export function createFilesystemDriver(): FilesystemDriver {
  return isTauri() ? createTauriFSDriver() : createOPFSDriver();
}

export function getFilesystemDriver(): FilesystemDriver {
  filesystemDriver ??= createFilesystemDriver();
  return filesystemDriver;
}