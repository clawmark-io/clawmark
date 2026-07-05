import { useEffect, useState } from "react";

const SNOOZE_REFRESH_DELAY_MS = 1_000;
const MAX_TIMEOUT_DELAY_MS = 2_147_483_647;

export function useSnoozeRefresh(snoozeUntilValues: Array<number | null>, enabled = true): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    let nextSnoozeUntil: number | null = null;

    for (const snoozeUntil of snoozeUntilValues) {
      if (snoozeUntil === null || snoozeUntil <= now) continue;
      if (nextSnoozeUntil === null || snoozeUntil < nextSnoozeUntil) {
        nextSnoozeUntil = snoozeUntil;
      }
    }

    if (nextSnoozeUntil === null) return;

    const delay = Math.min(
      Math.max(0, nextSnoozeUntil - now + SNOOZE_REFRESH_DELAY_MS),
      MAX_TIMEOUT_DELAY_MS,
    );
    const timeoutId = window.setTimeout(() => {
      setVersion((current) => current + 1);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, snoozeUntilValues, version]);

  return version;
}