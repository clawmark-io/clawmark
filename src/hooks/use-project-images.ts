import { useState, useEffect, useCallback, useRef } from "react";
import { generateId } from "@/lib/utils/id";
import type { Project } from "@/types/data-model";
import { useOptionalWorkspaceClient } from "@/stores/manager-context";

type ProjectImages = {
  backgroundUrl: string | null;
  logoUrl: string | null;
  uploadBackground: (file: File) => Promise<{ version: string; mimeType: string }>;
  removeBackground: () => Promise<void>;
  uploadLogo: (file: File) => Promise<{ version: string; mimeType: string }>;
  removeLogo: () => Promise<void>;
  reloadBackground: () => Promise<void>;
};

export function useProjectImages(
  _workspaceId: string,
  projectId: string | null,
  backgroundVersion: string | undefined,
  logoVersion: string | undefined,
  allProjects?: Record<string, Project>,
): ProjectImages {
  const client = useOptionalWorkspaceClient();
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Track previous versions for GC (§5.4)
  const prevBgRef = useRef<string | undefined>(undefined);
  const prevLogoRef = useRef<string | undefined>(undefined);
  const projectsRef = useRef(allProjects);
  projectsRef.current = allProjects;

  // Keep a stable ref to images for use in callbacks
  const clientRef = useRef(client);
  clientRef.current = client;

  // Load background image — with server download fallback (§5.2)
  useEffect(() => {
    if (!client || !projectId || !backgroundVersion) {
      setBackgroundUrl(null);
      return;
    }
    let revoked = false;
    client.images.loadOrFetch(backgroundVersion).then((url) => {
      if (!revoked) setBackgroundUrl(url);
    });
    return () => {
      revoked = true;
      setBackgroundUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [client, projectId, backgroundVersion]);

  // Load logo image — with server download fallback (§5.2)
  useEffect(() => {
    if (!client || !projectId || !logoVersion) {
      setLogoUrl(null);
      return;
    }
    let revoked = false;
    client.images.loadOrFetch(logoVersion).then((url) => {
      if (!revoked) setLogoUrl(url);
    });
    return () => {
      revoked = true;
      setLogoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [client, projectId, logoVersion]);

  // GC: when background version changes, clean up old UUID if unreferenced (§5.4)
  useEffect(() => {
    const oldBg = prevBgRef.current;
    prevBgRef.current = backgroundVersion;
    if (oldBg && oldBg !== backgroundVersion && projectsRef.current && clientRef.current) {
      clientRef.current.images.gcIfUnreferenced(oldBg, projectsRef.current);
    }
  }, [backgroundVersion]);

  // GC: when logo version changes, clean up old UUID if unreferenced (§5.4)
  useEffect(() => {
    const oldLogo = prevLogoRef.current;
    prevLogoRef.current = logoVersion;
    if (oldLogo && oldLogo !== logoVersion && projectsRef.current && clientRef.current) {
      clientRef.current.images.gcIfUnreferenced(oldLogo, projectsRef.current);
    }
  }, [logoVersion]);

  // Upload background: save to OPFS + enqueue for sync servers (§5.1)
  const uploadBackground = useCallback(async (file: File) => {
    const c = clientRef.current;
    if (!projectId || !c) return { version: "", mimeType: "" };
    const newUuid = generateId();
    await c.images.save(newUuid, file);
    const url = await c.images.load(newUuid);
    setBackgroundUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    await c.images.syncEnqueue(newUuid);
    c.flushConnectedServers();
    return { version: newUuid, mimeType: file.type || "image/png" };
  }, [projectId]);

  const removeBackground = useCallback(async () => {
    setBackgroundUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  // Upload logo: save to OPFS + enqueue for sync servers (§5.1)
  const uploadLogo = useCallback(async (file: File) => {
    const c = clientRef.current;
    if (!projectId || !c) return { version: "", mimeType: "" };
    const newUuid = generateId();
    await c.images.save(newUuid, file);
    const url = await c.images.load(newUuid);
    setLogoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    await c.images.syncEnqueue(newUuid);
    c.flushConnectedServers();
    return { version: newUuid, mimeType: file.type || "image/png" };
  }, [projectId]);

  const removeLogo = useCallback(async () => {
    setLogoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const reloadBackground = useCallback(async () => {
    const c = clientRef.current;
    if (!projectId || !backgroundVersion || !c) return;
    const url = await c.images.loadOrFetch(backgroundVersion);
    setBackgroundUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [projectId, backgroundVersion]);

  return { backgroundUrl, logoUrl, uploadBackground, removeBackground, uploadLogo, removeLogo, reloadBackground };
}
