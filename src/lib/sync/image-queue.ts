export type ImageQueueEntry = {
  type: "put";
  workspaceId: string;
  serverId: string;
  uuid: string;
};

const DB_NAME = "image-sync-queue";
const DB_VERSION = 1;
const STORE_NAME = "entries";

function entryKey(entry: ImageQueueEntry): string {
  return `${entry.workspaceId}-${entry.serverId}-${entry.uuid}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.addEventListener("error", () => reject(request.error));
  });
}

function txPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.addEventListener("error", () => reject(tx.error));
  });
}

function requestPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.addEventListener("error", () => reject(request.error));
  });
}

export async function enqueueImagePut(entry: ImageQueueEntry): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ key: entryKey(entry), ...entry });
    await txPromise(tx);
  } finally {
    db.close();
  }
}

export async function enqueueImagePuts(entries: ImageQueueEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const entry of entries) {
      store.put({ key: entryKey(entry), ...entry });
    }
    await txPromise(tx);
  } finally {
    db.close();
  }
}

export async function getEntriesForServer(
  workspaceId: string,
  serverId: string,
): Promise<ImageQueueEntry[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const all = await requestPromise(store.getAll());
    return all
      .filter((row: { workspaceId: string; serverId: string }) =>
        row.workspaceId === workspaceId && row.serverId === serverId,
      )
      .map((row: { type: "put"; workspaceId: string; serverId: string; uuid: string }) => ({
        type: row.type,
        workspaceId: row.workspaceId,
        serverId: row.serverId,
        uuid: row.uuid,
      }));
  } finally {
    db.close();
  }
}

export async function removeEntry(entry: ImageQueueEntry): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(entryKey(entry));
    await txPromise(tx);
  } finally {
    db.close();
  }
}

export async function removeEntries(entries: ImageQueueEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const entry of entries) {
      store.delete(entryKey(entry));
    }
    await txPromise(tx);
  } finally {
    db.close();
  }
}

export async function clearAllEntries(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    await txPromise(tx);
  } finally {
    db.close();
  }
}
