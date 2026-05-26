import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type CraneImages } from '../../../config/cranesConfig';
import { useLubricationPointBatch } from '../../../hooks/useLubricationPointBatch';
import { isCriticalLubricationPoint, pickLubricationData } from '../../diagram/diagramPointUtils';
import { buildEntries, type FleetEntry } from '../analytics/fleetEntries';
import { stepToPath } from '../../../navigation/paths';
import './CriticalPointsPanel.css';

type CriticalPointsPanelProps = {
  craneId: string;
  images: CraneImages;
};

type CriticalEntryWithData = FleetEntry & { data: NonNullable<ReturnType<typeof pickLubricationData>> };

const formatAmount = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return `${rounded}`;
};

const CriticalPointsPanel = ({ craneId, images }: CriticalPointsPanelProps) => {
  const navigate = useNavigate();

  const entries = useMemo(() => buildEntries(craneId, images), [craneId, images]);

  const dbNames = useMemo(() => {
    const names = new Set<string>();
    entries.forEach(entry => entry.dbCandidates.forEach(name => names.add(name)));
    return [...names];
  }, [entries]);

  const { lubricationDataMap } = useLubricationPointBatch(dbNames);

  const criticalEntries = useMemo(() => {
    const list: CriticalEntryWithData[] = [];

    entries.forEach(entry => {
      const data = pickLubricationData(lubricationDataMap, entry.dbCandidates);
      if (isCriticalLubricationPoint(data) && data) {
        list.push({ ...entry, data });
      }
    });

    return list.sort(
      (a, b) => a.sectionLabel.localeCompare(b.sectionLabel) || a.label.localeCompare(b.label),
    );
  }, [entries, lubricationDataMap]);

  const handleNavigate = (entry: FleetEntry) => {
    const path = stepToPath(craneId, entry.stepId);
    navigate(path, { state: { focusPointId: entry.point.id, fromCriticalPanel: true } });
  };

  if (!criticalEntries.length) {
    return (
      <aside className="critical-panel" aria-label="Points critiques">
        <header className="critical-panel__header">
          <div>
            <p className="critical-panel__eyebrow">Surveillance</p>
            <h2 className="critical-panel__title">Points critiques</h2>
          </div>
          <span className="critical-panel__pill critical-panel__pill--muted">0</span>
        </header>
        <p className="critical-panel__empty">Aucun point rouge actuellement.</p>
      </aside>
    );
  }

  return (
    <aside className="critical-panel" aria-label="Points critiques">
      <header className="critical-panel__header">
        <div>
          <p className="critical-panel__eyebrow">Surveillance</p>
          <h2 className="critical-panel__title">Points critiques</h2>
        </div>
        <span className="critical-panel__pill">{criticalEntries.length}</span>
      </header>

      <div className="critical-panel__list" role="list">
        {criticalEntries.map(entry => {
          const data = pickLubricationData(lubricationDataMap, entry.dbCandidates);
          const isMissingActual = data?.actualAmount === null || data?.actualAmount === undefined;
          return (
            <button
              key={entry.point.id}
              type="button"
              className="critical-panel__item"
              onClick={() => handleNavigate(entry)}
              aria-label={`Aller au point ${entry.label}`}
            >
              <div className="critical-panel__item-header">
                <span className="critical-panel__name">{entry.label}</span>
                <span className="critical-panel__chip">{entry.sectionLabel}</span>
              </div>
              <div className="critical-panel__meta">
                <span className="critical-panel__tag">{entry.tagLabel}</span>
                <span className="critical-panel__values">
                  {isMissingActual
                    ? 'Qté réelle manquante'
                    : `Planifié ${formatAmount(data?.plannedAmount)} / Réel ${formatAmount(data?.actualAmount)}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default CriticalPointsPanel;
