import { useState, useEffect, useReducer, useMemo } from "react";
import type { Project } from "@/types/data-model";
import {
  computeFingerprint,
  cheapHash,
  getStoredFingerprint,
  setStoredFingerprint,
  getMemoryCache,
  setMemoryCache,
  clearMemoryCache,
  removeStoredFingerprint,
  loadPreview,
  savePreview,
  getOrCreateThumbnail,
  renderPreview,
  previewSemaphore,
} from "@/lib/preview-cache";
import { useThemeStore } from "@/stores/theme-store";

type PreviewState = {
  previewUrl: string | null;
  loading: boolean;
};

export function useProjectPreview(
  workspaceId: string,
  project: Project,
): PreviewState {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const customColors = useThemeStore((s) => s.customColors);
  const themeKey = useMemo(
    () =>
      currentTheme === "custom"
        ? `custom-${cheapHash(JSON.stringify(customColors))}`
        : currentTheme,
    [currentTheme, customColors],
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    const entry = getMemoryCache(project.id);
    const fp = computeFingerprint(project, themeKey);
    if (entry?.fingerprint === fp) return entry.blobUrl;
    if (entry) return entry.blobUrl;
    return null;
  });
  const [loading, setLoading] = useState(() => {
    const entry = getMemoryCache(project.id);
    const fp = computeFingerprint(project, themeKey);
    return !entry || entry.fingerprint !== fp;
  });

  // Re-trigger preview generation when a background image arrives via sync
  const [imageSyncGen, bumpImageSyncGen] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    const bgVersion = project.backgroundVersion;
    if (!bgVersion) return;
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.uuid === bgVersion) {
        clearMemoryCache(project.id);
        removeStoredFingerprint(workspaceId, project.id);
        bumpImageSyncGen();
      }
    };
    window.addEventListener("image-synced", handler);
    return () => window.removeEventListener("image-synced", handler);
  }, [workspaceId, project.id, project.backgroundVersion]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const projectId = project.id;
    const fingerprint = computeFingerprint(project, themeKey);

    (async () => {
      // Step 1: Check in-memory cache
      const memEntry = getMemoryCache(projectId);
      if (memEntry?.fingerprint === fingerprint) {
        setPreviewUrl(memEntry.blobUrl);
        setLoading(false);
        return;
      }

      // Step 2: Check OPFS + localStorage fingerprint
      const storedFp = getStoredFingerprint(workspaceId, projectId);
      if (storedFp === fingerprint) {
        const opfsUrl = await loadPreview(workspaceId, projectId);
        if (signal.aborted) {
          if (opfsUrl) URL.revokeObjectURL(opfsUrl);
          return;
        }
        if (opfsUrl) {
          setMemoryCache(projectId, { blobUrl: opfsUrl, fingerprint });
          setPreviewUrl(opfsUrl);
          setLoading(false);
          return;
        }
      }

      // Step 3: Stale-while-revalidate — show stale if available
      if (memEntry) {
        setPreviewUrl(memEntry.blobUrl);
        setLoading(false);
      } else if (storedFp) {
        const staleUrl = await loadPreview(workspaceId, projectId);
        if (signal.aborted) {
          if (staleUrl) URL.revokeObjectURL(staleUrl);
          return;
        }
        if (staleUrl) {
          setPreviewUrl(staleUrl);
          setLoading(false);
        }
      }

      // Step 4: Acquire semaphore (rejects on abort)
      try {
        await previewSemaphore.acquire(signal);
      } catch {
        return;
      }

      try {
        if (signal.aborted) return;

        // Step 5: Load/create background thumbnail if needed
        let thumbnailUrl: string | null = null;
        if (project.backgroundVersion) {
          thumbnailUrl = await getOrCreateThumbnail(workspaceId, project.backgroundVersion);
          if (signal.aborted) {
            if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
            return;
          }
        }

        // Step 6: Render preview to canvas
        const blob = await renderPreview(project, thumbnailUrl);
        if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);

        if (signal.aborted || !blob) return;

        // Step 7: Save to OPFS
        await savePreview(workspaceId, projectId, blob);
        if (signal.aborted) return;

        // Step 8: Write fingerprint to localStorage
        setStoredFingerprint(workspaceId, projectId, fingerprint);

        // Step 9: Create blob URL and update memory cache
        const newUrl = URL.createObjectURL(blob);
        const oldEntry = getMemoryCache(projectId);
        const oldBlobUrl = oldEntry?.blobUrl;
        setMemoryCache(projectId, { blobUrl: newUrl, fingerprint });
        setPreviewUrl(newUrl);
        setLoading(false);

        if (oldBlobUrl && oldBlobUrl !== newUrl) {
          URL.revokeObjectURL(oldBlobUrl);
        }
      } finally {
        previewSemaphore.release();
      }
    })();

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- We intentionally list specific project properties instead of `project` to avoid re-running on every project reference change.
  }, [workspaceId, project.id, project.updatedAt, project.backgroundVersion, project.kanbanEnabled, project.backgroundBlur, project.backgroundSepia, project.backgroundGrayscale, project.backgroundOpacity, themeKey, imageSyncGen]);

  return { previewUrl, loading };
}
