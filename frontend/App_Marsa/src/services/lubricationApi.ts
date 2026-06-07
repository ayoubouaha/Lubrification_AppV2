import { type ExecutionDate, type LubricationPointDto } from '../types/lubricationPoint';

export class LubricationApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'LubricationApiError';
    this.status = status;
  }
}

export const fetchLubricationPoint = async (
  name: string,
  signal?: AbortSignal,
): Promise<LubricationPointDto> => {
  const encodedName = encodeURIComponent(name);
  const cacheBuster = `__ts=${Date.now()}`;
  const url = `/api/lubrication/latest/${encodedName}?${cacheBuster}`;

  const response = await fetch(url, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep default message when body is not JSON.
    }

    throw new LubricationApiError(response.status, message);
  }

  return (await response.json()) as LubricationPointDto;
};

const parseJsonOrThrow = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep default message when body is not JSON.
    }
    throw new LubricationApiError(response.status, message);
  }

  return (await response.json()) as T;
};

export interface SyncStateDto {
  /** ISO date (yyyy-MM-dd) of the most recent data in the cache, or null. */
  lastSyncDate: string | null;
  /** ISO instant (UTC) of the last sync run (system time), or null if never synced. */
  lastSyncedAt: string | null;
  initialHistorySyncRequired: boolean;
}

/** Backend sync state — used for the data-freshness indicator. */
export const fetchSyncState = async (signal?: AbortSignal): Promise<SyncStateDto> => {
  const response = await fetch(`/api/sync/state?__ts=${Date.now()}`, {
    signal,
    cache: 'no-store',
  });

  return parseJsonOrThrow<SyncStateDto>(response);
};

/** Lists the distinct execution dates (with their graisseurs) present in the cache, newest first. */
export const fetchExecutionDates = async (signal?: AbortSignal): Promise<ExecutionDate[]> => {
  const response = await fetch(`/api/execution-dates?__ts=${Date.now()}`, {
    signal,
    cache: 'no-store',
  });

  return parseJsonOrThrow<ExecutionDate[]>(response);
};

/**
 * Fetches every point's lubrication event for the exact execution date. When a graisseur is given,
 * only that graisseur's events are returned; points absent from the result were not lubricated on
 * that date (by that graisseur).
 */
export const fetchLubricationByDate = async (
  date: string,
  graisseur?: string | null,
  signal?: AbortSignal,
): Promise<LubricationPointDto[]> => {
  const params = new URLSearchParams({ date, __ts: `${Date.now()}` });
  if (graisseur) {
    params.set('graisseur', graisseur);
  }
  const response = await fetch(`/api/lubrication/by-date?${params.toString()}`, {
    signal,
    cache: 'no-store',
  });

  return parseJsonOrThrow<LubricationPointDto[]>(response);
};
