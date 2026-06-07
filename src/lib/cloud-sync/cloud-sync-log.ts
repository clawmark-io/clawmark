type CloudSyncLogDetails = Record<string, unknown>;

export function logCloudSync(event: string, details?: CloudSyncLogDetails): void {
  if (details) {
    console.info(`[cloud-sync] ${event}`, details);
  } else {
    console.info(`[cloud-sync] ${event}`);
  }
}

export function warnCloudSync(event: string, details?: CloudSyncLogDetails): void {
  if (details) {
    console.warn(`[cloud-sync] ${event}`, details);
  } else {
    console.warn(`[cloud-sync] ${event}`);
  }
}
