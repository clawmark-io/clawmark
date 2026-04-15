const STORAGE_KEY = "cloudsyncAuth";

export type CloudSyncAuth = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  cloudSyncUrl?: string;
};

// --- Auth change notification ---

let authVersion = 0;
const authListeners = new Set<() => void>();

export function subscribeAuthChange(cb: () => void): () => void {
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

export function getAuthVersion(): number {
  return authVersion;
}

export function notifyAuthChange(): void {
  authVersion++;
  authListeners.forEach((l) => l());
}

// --- Storage ---

export function getCloudSyncAuth(): CloudSyncAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.accessToken === "string" && typeof parsed.refreshToken === "string") {
      return parsed as CloudSyncAuth;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCloudSyncAuth(auth: CloudSyncAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  notifyAuthChange();
}

export function clearCloudSyncAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  notifyAuthChange();
}

export function updateCloudSyncAccessToken(accessToken: string, expiresAt: number): void {
  const current = getCloudSyncAuth();
  if (!current) return;
  setCloudSyncAuth({ ...current, accessToken, expiresAt });
}

export function isCloudSyncSignedIn(): boolean {
  return getCloudSyncAuth() !== null;
}
