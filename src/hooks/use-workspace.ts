import { useSyncExternalStore, useRef, useCallback } from "react";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace } from "@/types/data-model";

export function useWorkspaceDoc(handle: DocHandle<Workspace> | null) {
  const docRef = useRef<Workspace | undefined>(undefined);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!handle) {
        docRef.current = undefined;
        return () => {};
      }
      docRef.current = handle.isReady() ? handle.doc() : undefined;
      const onChange = () => {
        docRef.current = handle.isReady() ? handle.doc() : undefined;
        onStoreChange();
      };
      handle.on("change", onChange);
      return () => {
        handle.off("change", onChange);
      };
    },
    [handle],
  );

  const getSnapshot = useCallback(() => docRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}
