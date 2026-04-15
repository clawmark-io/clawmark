import { getFilesystemDriver } from "@/lib/workspace/drivers/runtime-driver";

// Legacy image-storage helpers kept for existing call sites.
const filesystem = getFilesystemDriver();

export async function saveImage(
  workspaceId: string,
  imageUuid: string,
  data: Blob,
): Promise<void> {
  await filesystem.write(workspaceId, `images/${imageUuid}`, data);
}

export async function loadImage(
  workspaceId: string,
  imageUuid: string,
): Promise<string | null> {
  const blob = await filesystem.read(workspaceId, `images/${imageUuid}`);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function loadImageAsBlob(
  workspaceId: string,
  imageUuid: string,
): Promise<Blob | null> {
  return filesystem.read(workspaceId, `images/${imageUuid}`);
}

export async function loadImageAsDataUrl(
  workspaceId: string,
  imageUuid: string,
): Promise<string | null> {
  return filesystem.readAsDataUrl(workspaceId, `images/${imageUuid}`);
}

export async function removeImage(
  workspaceId: string,
  imageUuid: string,
): Promise<void> {
  await filesystem.remove(workspaceId, `images/${imageUuid}`);
}

export async function imageExists(
  workspaceId: string,
  imageUuid: string,
): Promise<boolean> {
  return filesystem.exists(workspaceId, `images/${imageUuid}`);
}

export async function removeAllProjectImages(workspaceId: string, _projectId: string): Promise<void> {
  // No-op in UUID-based storage. Image cleanup is handled by GC logic
  // that checks if UUIDs are still referenced by any project.
  void workspaceId;
}

export async function removeAllWorkspaceImages(workspaceId: string): Promise<void> {
  await filesystem.removeDirectory(workspaceId, "");
}
