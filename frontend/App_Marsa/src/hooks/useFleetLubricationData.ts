import { useMemo } from 'react';
import { cranes } from '../config/cranesConfig';
import { buildEntries } from '../components/dashboard/analytics/fleetEntries';
import {
  pickLubricationData,
  resolveLubricationStatus,
  computeLubricationPercentValue,
  type LubricationStatus,
} from '../components/diagram/diagramPointUtils';
import { useDateLubricationData } from './useDateLubricationData';
import type { ExecutionDate } from '../types/lubricationPoint';
import type { StepId } from '../navigation/steps';

export interface FleetPointRow {
  craneId: string;
  craneName: string;
  zone: string;
  pointName: string;
  /** All DB names this point is known by (grouped markers carry several, e.g. A19 / A20). */
  pointNames: string[];
  planned: number | null;
  actual: number | null;
  percent: number | null;
  status: LubricationStatus;
  /** Diagram marker id, used to locate the point on the technical schema. */
  pointId: string;
  /** Diagram step the point belongs to (system + zone). */
  stepId: StepId;
  /** Human-readable point label (marker label or name). */
  label: string;
  /** Tag shown under the point name (e.g. TRANSL-A22). */
  tagLabel: string;
  /** Section the point belongs to (e.g. "Translation - Côté Mer Nord A"). */
  sectionLabel: string;
  /** Graisseur who lubricated the point on the selected date, if any. */
  lubricator: string | null;
}

interface CraneEntrySet {
  craneId: string;
  craneName: string;
  entries: ReturnType<typeof buildEntries>;
}

export const useFleetLubricationData = (
  selectedDate: ExecutionDate | null,
  selectedGraisseur: string | null,
) => {
  const craneEntrySets = useMemo<CraneEntrySet[]>(() => {
    return Object.values(cranes)
      .filter(crane => crane.hasData)
      .map(crane => ({
        craneId: crane.id,
        craneName: crane.name,
        entries: buildEntries(crane.id, crane.images),
      }));
  }, []);

  const { lubricationDataMap, hasLoaded } = useDateLubricationData(selectedDate, selectedGraisseur);

  const rows = useMemo<FleetPointRow[]>(() => {
    const list: FleetPointRow[] = [];
    const seen = new Set<string>();

    craneEntrySets.forEach(set => {
      set.entries.forEach(entry => {
        const data = pickLubricationData(lubricationDataMap, entry.dbCandidates);
        // Keep points with no event in the selected period: they are "not done" (red),
        // rather than dropped from the dashboard.
        const pointName = data?.name ?? entry.dbCandidates[0];
        if (!pointName) return;

        const key = `${set.craneId}::${pointName}`;
        if (seen.has(key)) return;
        seen.add(key);

        const planned = data?.plannedAmount ?? null;
        const actual = data?.actualAmount ?? null;

        list.push({
          craneId: set.craneId,
          craneName: set.craneName,
          zone: entry.zone,
          pointName,
          pointNames: entry.dbCandidates,
          planned,
          actual,
          percent: computeLubricationPercentValue(actual, planned),
          status: resolveLubricationStatus(actual, planned),
          pointId: entry.point.id,
          stepId: entry.stepId,
          label: entry.label,
          tagLabel: entry.tagLabel,
          sectionLabel: entry.sectionLabel,
          lubricator: data?.lubricator ?? null,
        });
      });
    });

    return list;
  }, [craneEntrySets, lubricationDataMap]);

  // Expose the raw date-filtered map too so date-aware consumers (e.g. the interactive
  // schema panel) can reflect the same selected execution date instead of latest-state.
  return { rows, hasLoaded, lubricationDataMap };
};
