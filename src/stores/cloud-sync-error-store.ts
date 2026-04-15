import { createStore, readOnly } from "@/lib/store";
import type { ReadableStore } from "@/lib/store";

const errorStore = createStore<string | null>(null);

export const cloudSyncRefreshError: ReadableStore<string | null> = readOnly(errorStore);

export function setCloudSyncRefreshError(error: string | null): void {
  errorStore.set(error);
}
