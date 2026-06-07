import { useEffect, useMemo, useState } from 'react';
import { cranes } from '../config/cranesConfig';
import { buildEntries } from '../components/dashboard/analytics/fleetEntries';
import { pickLubricationData, resolveLubricationStatus } from '../components/diagram/diagramPointUtils';
import { fetchLubricationByDate } from '../services/lubricationApi';
import type { ExecutionDate } from '../types/lubricationPoint';

export interface ConformityTrendPoint {
  /** ISO date (yyyy-MM-dd). */
  date: string;
  /** Human-readable label, e.g. "01-05-2026". */
  label: string;
  /** Conformité % for the date (green / total mapped points), or null if no points. */
  value: number | null;
}

/** How many of the most recent execution dates the trend covers. */
const MAX_POINTS = 12;

/**
 * Computes the fleet conformité % for the most recent execution dates so the dashboard can show a
 * trend. Conformité is defined exactly like the KPI card — green points (Conforme + Sur-dosé) over
 * all mapped points — and is computed overall (tous graisseurs) for each date. Fetches each date
 * once on load; no polling.
 */
export const useConformityTrend = (dates: ExecutionDate[]) => {
  const [points, setPoints] = useState<ConformityTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const craneEntrySets = useMemo(
    () =>
      Object.values(cranes)
        .filter(crane => crane.hasData)
        .map(crane => ({ craneId: crane.id, entries: buildEntries(crane.id, crane.images) })),
    [],
  );

  useEffect(() => {
    if (!dates.length) {
      setPoints([]);
      return;
    }

    const controller = new AbortController();
    const recent = dates.slice(0, MAX_POINTS);
    setIsLoading(true);

    Promise.all(
      recent.map(async (executionDate): Promise<ConformityTrendPoint> => {
        try {
          const rows = await fetchLubricationByDate(executionDate.date, null, controller.signal);
          const map = new Map(rows.map(row => [row.name, row]));

          let total = 0;
          let green = 0;
          const seen = new Set<string>();

          craneEntrySets.forEach(set => {
            set.entries.forEach(entry => {
              const data = pickLubricationData(map, entry.dbCandidates);
              const name = data?.name ?? entry.dbCandidates[0];
              if (!name) return;

              const key = `${set.craneId}::${name}`;
              if (seen.has(key)) return;
              seen.add(key);

              total += 1;
              if (resolveLubricationStatus(data?.actualAmount ?? 0, data?.plannedAmount ?? 0) === 'green') {
                green += 1;
              }
            });
          });

          return {
            date: executionDate.date,
            label: executionDate.label,
            value: total ? (green / total) * 100 : null,
          };
        } catch {
          return { date: executionDate.date, label: executionDate.label, value: null };
        }
      }),
    )
      .then(results => {
        if (controller.signal.aborted) return;
        // Reverse to chronological order (oldest -> newest) for the chart.
        setPoints(results.reverse());
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [dates, craneEntrySets]);

  return { points, isLoading };
};
