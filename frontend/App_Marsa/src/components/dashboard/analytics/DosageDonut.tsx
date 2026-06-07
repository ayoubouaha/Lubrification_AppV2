import { useMemo } from 'react';
import type { FleetPointRow } from '../../../hooks/useFleetLubricationData';
import {
  resolveLubricationGrade,
  GRADE_RGB,
  GRADE_LABEL,
  type LubricationGrade,
} from '../../diagram/diagramPointUtils';
import './DosageDonut.css';

interface DosageDonutProps {
  rows: FleetPointRow[];
  isLoading: boolean;
}

const ORDER: LubricationGrade[] = ['conforme', 'surdose', 'sousdose', 'critique'];

const SIZE = 180;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const CIRC = 2 * Math.PI * RADIUS;

const DosageDonut = ({ rows, isLoading }: DosageDonutProps) => {
  const { counts, total, conformPct } = useMemo(() => {
    const counts: Record<LubricationGrade, number> = { conforme: 0, surdose: 0, sousdose: 0, critique: 0 };
    rows.forEach(row => {
      counts[resolveLubricationGrade(row.actual, row.planned)] += 1;
    });
    const total = rows.length;
    const conformPct = total ? ((counts.conforme + counts.surdose) / total) * 100 : 0;
    return { counts, total, conformPct };
  }, [rows]);

  let cursor = 0;
  const segments = ORDER.map(grade => {
    const value = counts[grade];
    const length = total ? (value / total) * CIRC : 0;
    const segment = {
      grade,
      value,
      dasharray: `${length} ${CIRC - length}`,
      dashoffset: -cursor,
      color: `rgb(${GRADE_RGB[grade]})`,
    };
    cursor += length;
    return segment;
  });

  return (
    <section className="donut-card" aria-label="État du dosage">
      <header className="donut-card__header">
        <p className="donut-card__eyebrow">Synthèse</p>
        <h3 className="donut-card__title">État du dosage</h3>
      </header>

      {isLoading && !total ? (
        <p className="donut-card__empty">Chargement des données…</p>
      ) : !total ? (
        <p className="donut-card__empty">Aucune donnée disponible.</p>
      ) : (
        <div className="donut-card__body">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="donut-card__svg" role="img">
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={STROKE}
              opacity={0.25}
            />
            {segments.map(segment => (
              <circle
                key={segment.grade}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE}
                strokeDasharray={segment.dasharray}
                strokeDashoffset={segment.dashoffset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              >
                <title>{`${GRADE_LABEL[segment.grade]} : ${segment.value}`}</title>
              </circle>
            ))}
            <text x={CENTER} y={CENTER - 2} className="donut-card__pct" textAnchor="middle">
              {conformPct.toFixed(0)}%
            </text>
            <text x={CENTER} y={CENTER + 18} className="donut-card__pct-label" textAnchor="middle">
              Conformité
            </text>
          </svg>

          <ul className="donut-card__legend">
            {ORDER.map(grade => (
              <li key={grade} className="donut-card__legend-item">
                <span className="donut-card__dot" style={{ background: `rgb(${GRADE_RGB[grade]})` }} aria-hidden="true" />
                <span className="donut-card__legend-label">{GRADE_LABEL[grade]}</span>
                <span className="donut-card__legend-value">{counts[grade]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default DosageDonut;
