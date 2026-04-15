import { useSyncExternalStore } from "react";
import type { ReadableStore } from "@/lib/store";

export function useStore<T>(store: ReadableStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get);
}
