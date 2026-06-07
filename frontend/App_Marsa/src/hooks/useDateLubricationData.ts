import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLubricationByDate } from '../services/lubricationApi';
import { type ExecutionDate, type LubricationPointDto } from '../types/lubricationPoint';

const POLL_INTERVAL_MS = 5000;

/**
 * Fetches all lubrication events for the selected execution date (optionally narrowed to a single
 * graisseur) in one batch call and keeps them fresh by polling. Returns a map keyed by DB point
 * name; points missing from the map were not lubricated on that date (by that graisseur).
 */
export const useDateLubricationData = (
  date: ExecutionDate | null,
  graisseur: string | null,
) => {
  const [lubricationDataMap, setLubricationDataMap] = useState<Map<string, LubricationPointDto>>(
    new Map(),
  );
  const [hasLoaded, setHasLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!date) {
      setLubricationDataMap(new Map());
      setHasLoaded(true);
      return;
    }

    try {
      const rows = await fetchLubricationByDate(date.date, graisseur);
      const map = new Map<string, LubricationPointDto>();
      rows.forEach(row => {
        // Mirror the DB for the selected date: a point only has real values when it has an event
        // on that date (actualDate set). Otherwise it was not lubricated then -> show 0, never a
        // leftover "prévu" carried over from another date.
        const hasEvent = row.actualDate != null;
        map.set(row.name, {
          ...row,
          plannedAmount: hasEvent ? (row.plannedAmount ?? 0) : 0,
          actualAmount: hasEvent ? (row.actualAmount ?? 0) : 0,
        });
      });
      setLubricationDataMap(map);
    } catch {
      // Keep the previous map on transient failures.
    } finally {
      setHasLoaded(true);
    }
  }, [date, graisseur]);

  useEffect(() => {
    // Reset loaded state when the selection changes so the UI can show its loading state.
    setHasLoaded(false);
    fetchData();
    intervalRef.current = window.setInterval(fetchData, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { lubricationDataMap, hasLoaded };
};
