import { useMemo } from 'react';
import { cranes } from '../config/cranesConfig';
import { buildEntries } from '../components/dashboard/analytics/fleetEntries';
import {
  pickLubricationData,
  resolveLubricationStatus,
  computeLubricationPercentValue,
  type LubricationStatus,
} from '../components/diagram/diagramPointUtils';
import { useLubricationPointBatch } from './useLubricationPointBatch';

export interface FleetPointRow {
  craneId: string;
  craneName: string;
  zone: string;
  pointName: string;
  planned: number | null;
  actual: number | null;
  percent: number | null;
  status: LubricationStatus;
}

interface CraneEntrySet {
  craneId: string;
  craneName: string;
  entries: ReturnType<typeof buildEntries>;
}

export const useFleetLubricationData = () => {
  const craneEntrySets = useMemo<CraneEntrySet[]>(() => {
    return Object.values(cranes)
      .filter(crane => crane.hasData)
      .map(crane => ({
        craneId: crane.id,
        craneName: crane.name,
        entries: buildEntries(crane.id, crane.images),
      }));
  }, []);

  const dbNames = useMemo(() => {
    const names = new Set<string>();
    craneEntrySets.forEach(set =>
      set.entries.forEach(entry => entry.dbCandidates.forEach(name => names.add(name))),
    );
    return [...names];
  }, [craneEntrySets]);

  const { lubricationDataMap, hasLoaded } = useLubricationPointBatch(dbNames);

  const rows = useMemo<FleetPointRow[]>(() => {
    const list: FleetPointRow[] = [];
    const seen = new Set<string>();

    craneEntrySets.forEach(set => {
      set.entries.forEach(entry => {
        const data = pickLubricationData(lubricationDataMap, entry.dbCandidates);
        if (!data) return;
        const key = `${set.craneId}::${data.name}`;
        if (seen.has(key)) return;
        seen.add(key);

        list.push({
          craneId: set.craneId,
          craneName: set.craneName,
          zone: entry.zone,
          pointName: data.name,
          planned: data.plannedAmount,
          actual: data.actualAmount,
          percent: computeLubricationPercentValue(data.actualAmount, data.plannedAmount),
          status: resolveLubricationStatus(data.actualAmount, data.plannedAmount),
        });
      });
    });

    return list;
  }, [craneEntrySets, lubricationDataMap]);

  return { rows, hasLoaded };
};
