import { useMemo } from 'react';
import type { DiagramPoint } from '../../diagram/types';
import type { LubricationPointDto } from '../../../types/lubricationPoint';
import {
  getDbNameCandidates,
  resolveLubricationStatus,
  computeLubricationPercentValue,
} from '../../diagram/diagramPointUtils';
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
}

const STATUS_LABEL: Record<'green' | 'orange' | 'red', string> = {
  green: 'Conforme',
  orange: 'Sous-dosé',
  red: 'Critique',
};

const fmt = (value: number | null | undefined, digits = 0): string =>
  value === null || value === undefined
    ? '—'
    : value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const PointDetailCard = ({ point, dataMap, subtitle, stats }: PointDetailCardProps) => {
  const candidates = useMemo(() => (point ? getDbNameCandidates(point) : []), [point]);

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
  const status = resolveLubricationStatus(actual, planned);
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

          <div className="point-detail__grid">
            <div className="point-detail__metric">
              <span className="point-detail__metric-label">Prévu</span>
              <span className="point-detail__metric-value">{fmt(planned)} g</span>
            </div>
            <div className="point-detail__metric">
              <span className="point-detail__metric-label">Effectué</span>
              <span className="point-detail__metric-value">{fmt(actual)} g</span>
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
            {STATUS_LABEL[status]}
          </div>
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
