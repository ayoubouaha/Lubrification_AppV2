import { useMemo } from 'react';
import type { DiagramPoint } from '../../diagram/types';
import type { LubricationPointDto } from '../../../types/lubricationPoint';
import {
  getDbNameCandidates,
  resolveLubricationStatus,
  resolveLubricationGrade,
  computeLubricationPercentValue,
  GRADE_LABEL,
} from '../../diagram/diagramPointUtils';
import type { PointHistoryEntry } from '../../../hooks/usePointHistory';
import './PointDetailCard.css';

export interface ViewStats {
  total: number;
  conforme: number;
  sousDose: number;
  surDose: number;
}

interface PointDetailCardProps {
  point: DiagramPoint | null;
  dataMap: Map<string, LubricationPointDto>;
  subtitle: string;
  stats: ViewStats;
  history?: Map<string, PointHistoryEntry[]>;
}

const SPARK_W = 248;
const SPARK_H = 60;
const SPARK_PAD = 6;

/** Small line of effectué (solid green) vs prévu (faint dashed) over the recent execution dates. */
const HistorySparkline = ({ entries }: { entries: PointHistoryEntry[] }) => {
  const greasedCount = entries.filter(e => e.actual !== null && e.actual > 0).length;
  if (greasedCount < 2) return null;

  const max = Math.max(1, ...entries.flatMap(e => [e.actual ?? 0, e.planned ?? 0]));
  const n = entries.length;
  const x = (i: number) => SPARK_PAD + (n <= 1 ? 0 : (i / (n - 1)) * (SPARK_W - 2 * SPARK_PAD));
  const y = (v: number) => SPARK_PAD + (1 - v / max) * (SPARK_H - 2 * SPARK_PAD);

  let plannedPath = '';
  let plannedConnected = false;
  let actualPath = '';
  let actualConnected = false;
  entries.forEach((e, i) => {
    if (e.planned != null) {
      plannedPath += `${plannedConnected ? 'L' : 'M'}${x(i).toFixed(1)},${y(e.planned).toFixed(1)} `;
      plannedConnected = true;
    } else {
      plannedConnected = false;
    }
    if (e.actual != null && e.actual > 0) {
      actualPath += `${actualConnected ? 'L' : 'M'}${x(i).toFixed(1)},${y(e.actual).toFixed(1)} `;
      actualConnected = true;
    } else {
      actualConnected = false;
    }
  });

  return (
    <div className="point-detail__history">
      <span className="point-detail__history-label">Historique · effectué vs prévu</span>
      <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} className="point-detail__spark" role="img">
        <path d={plannedPath.trim()} className="point-detail__spark-planned" />
        <path d={actualPath.trim()} className="point-detail__spark-actual" />
        {entries.map((e, i) =>
          e.actual !== null && e.actual > 0 ? (
            <circle key={e.date} cx={x(i)} cy={y(e.actual)} r={2} className="point-detail__spark-dot">
              <title>{`${e.label} : ${Math.round(e.actual)} g`}</title>
            </circle>
          ) : null,
        )}
      </svg>
    </div>
  );
};

const fmt = (value: number | null | undefined, digits = 0): string =>
  value === null || value === undefined
    ? '—'
    : value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Amounts arrive from the backend already in grams; format without extra scaling. */
const fmtGrams = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? '—'
    : value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PointDetailCard = ({ point, dataMap, subtitle, stats, history }: PointDetailCardProps) => {
  const candidates = useMemo(() => (point ? getDbNameCandidates(point) : []), [point]);

  const historyEntries = useMemo<PointHistoryEntry[]>(() => {
    if (!history) return [];
    for (const name of candidates) {
      const entries = history.get(name);
      if (entries && entries.length) return entries;
    }
    return [];
  }, [history, candidates]);

  const matched = useMemo<LubricationPointDto[]>(() => {
    const seen = new Set<string>();
    const list: LubricationPointDto[] = [];
    candidates.forEach(name => {
      const data = dataMap.get(name);
      if (data && !seen.has(data.name)) {
        seen.add(data.name);
        list.push(data);
      }
    });
    return list;
  }, [candidates, dataMap]);

  const displayName = matched.length
    ? matched.map(item => item.name).join(' / ')
    : point?.dbName?.trim() || candidates[0] || point?.name || '';

  const planned = matched.length
    ? matched.reduce((sum, item) => sum + (item.plannedAmount ?? 0), 0)
    : null;
  const actual = matched.length
    ? matched.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0)
    : null;
  const interval = matched.find(item => item.interval !== null)?.interval ?? null;
  const lubricator = matched.find(item => item.lubricator)?.lubricator ?? null;
  const status = resolveLubricationStatus(actual, planned);
  const grade = resolveLubricationGrade(actual, planned);
  const percent = computeLubricationPercentValue(actual, planned);
  const ecart =
    actual !== null && planned !== null && planned > 0 ? ((actual - planned) / planned) * 100 : null;

  return (
    <aside className="point-detail" aria-live="polite">
      {!point ? (
        <div className="point-detail__placeholder">
          <span className="point-detail__placeholder-icon" aria-hidden="true">⊕</span>
          <p>Survolez un point sur le schéma pour afficher ses données.</p>
        </div>
      ) : (
        <div className={`point-detail__card point-detail__card--${status}`}>
          <p className="point-detail__eyebrow">Point graissage</p>
          <h3 className="point-detail__name">{displayName}</h3>
          <p className="point-detail__subtitle">{subtitle}</p>
          {lubricator ? (
            <p className="point-detail__subtitle">Graisseur · {lubricator}</p>
          ) : null}

          <div className="point-detail__grid">
            <div className="point-detail__metric">
              <span className="point-detail__metric-label">Prévu</span>
              <span className="point-detail__metric-value">{fmtGrams(planned)} g</span>
            </div>
            <div className="point-detail__metric">
              <span className="point-detail__metric-label">Effectué</span>
              <span className="point-detail__metric-value">{fmtGrams(actual)} g</span>
            </div>
            <div className="point-detail__metric">
              <span className="point-detail__metric-label">Écart</span>
              <span className={`point-detail__metric-value point-detail__ecart--${status}`}>
                {ecart === null ? '—' : `${ecart > 0 ? '+' : ''}${fmt(ecart, 1)} %`}
              </span>
            </div>
            <div className="point-detail__metric">
              <span className="point-detail__metric-label">Lubrifiant</span>
              <span className="point-detail__metric-value">
                EP2{interval !== null ? ` · ${fmt(interval)}j` : ''}
              </span>
            </div>
          </div>

          <div className="point-detail__progress" aria-hidden="true">
            <span
              className={`point-detail__progress-fill point-detail__progress-fill--${status}`}
              style={{ width: `${Math.min(percent ?? 0, 100)}%` }}
            />
          </div>

          <div className={`point-detail__badge point-detail__badge--${status}`}>
            <span className="point-detail__badge-dot" />
            {GRADE_LABEL[grade]}
          </div>

          {historyEntries.length ? <HistorySparkline entries={historyEntries} /> : null}
        </div>
      )}

      <div className="point-detail__stats">
        <div className="point-detail__stat">
          <span className="point-detail__stat-value">{stats.total}</span>
          <span className="point-detail__stat-label">Points</span>
        </div>
        <div className="point-detail__stat point-detail__stat--green">
          <span className="point-detail__stat-value">{stats.conforme}</span>
          <span className="point-detail__stat-label">Conformés</span>
        </div>
        <div className="point-detail__stat point-detail__stat--orange">
          <span className="point-detail__stat-value">{stats.sousDose}</span>
          <span className="point-detail__stat-label">Sous-dosés</span>
        </div>
        <div className="point-detail__stat point-detail__stat--blue">
          <span className="point-detail__stat-value">{stats.surDose}</span>
          <span className="point-detail__stat-label">Sur-dosés</span>
        </div>
      </div>
    </aside>
  );
};

export default PointDetailCard;
