import { useEffect, useState } from 'react';
import { fetchExecutionDates, fetchLubricationByDate } from '../services/lubricationApi';

export interface PointHistoryEntry {
  date: string;
  label: string;
  planned: number | null;
  actual: number | null;
}

/** How many of the most recent execution dates the point history covers. */
const MAX_DATES = 12;

/**
 * Loads the recent execution dates' data once and builds a per-point history (effectué / prévu over
 * time), keyed by DB point name. Fetched a single time on mount and reused for every point, so
 * hovering points costs nothing.
 */
export const usePointHistory = (): Map<string, PointHistoryEntry[]> => {
  const [history, setHistory] = useState<Map<string, PointHistoryEntry[]>>(new Map());

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const dates = await fetchExecutionDates(controller.signal);
        const recent = dates.slice(0, MAX_DATES);
        const perDate = await Promise.all(
          recent.map(async date => ({
            date: date.date,
            label: date.label,
            rows: await fetchLubricationByDate(date.date, null, controller.signal),
          })),
        );

        // Chronological order (oldest -> newest) for the sparkline.
        const chronological = perDate.reverse();
        const map = new Map<string, PointHistoryEntry[]>();
        chronological.forEach(({ date, label, rows }) => {
          rows.forEach(row => {
            const entries = map.get(row.name) ?? [];
            entries.push({ date, label, planned: row.plannedAmount, actual: row.actualAmount });
            map.set(row.name, entries);
          });
        });

        if (!controller.signal.aborted) setHistory(map);
      } catch {
        // Leave history empty; the card just omits the sparkline.
      }
    })();

    return () => controller.abort();
  }, []);

  return history;
};
