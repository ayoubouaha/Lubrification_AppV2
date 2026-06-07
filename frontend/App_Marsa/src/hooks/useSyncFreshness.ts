import { useEffect, useState } from 'react';
import { fetchSyncState } from '../services/lubricationApi';

/** How often we re-fetch the backend sync state. */
const CHECK_INTERVAL_MS = 60_000;

interface SyncFreshness {
  /** Epoch ms of the last real sync run (system time), or null if never synced. */
  lastSyncedAtMs: number | null;
  /** Whether the last check reached the backend. */
  online: boolean;
}

/**
 * Polls the backend sync state for the data-freshness indicator. Exposes the backend's real sync
 * timestamp ({@code lastSyncedAt}, the system time when the backend received data from the
 * remote-api) so the UI can show exactly when the cache was last refreshed.
 */
export const useSyncFreshness = (): SyncFreshness => {
  const [lastSyncedAtMs, setLastSyncedAtMs] = useState<number | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const state = await fetchSyncState();
        if (!active) return;
        const parsed = state.lastSyncedAt ? Date.parse(state.lastSyncedAt) : NaN;
        setLastSyncedAtMs(Number.isNaN(parsed) ? null : parsed);
        setOnline(true);
      } catch {
        if (active) setOnline(false);
      }
    };

    load();
    const poll = window.setInterval(load, CHECK_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, []);

  return { lastSyncedAtMs, online };
};
