import { useEffect, useMemo, useState } from 'react';
import type { FleetPointRow } from '../../../hooks/useFleetLubricationData';
import './AnomaliesPanel.css';

interface AnomaliesPanelProps {
  rows: FleetPointRow[];
  isLoading: boolean;
  onLocate: (row: FleetPointRow) => void;
}

const PAGE_SIZE = 8;

const formatAmount = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  return `${Math.round((value + Number.EPSILON) * 100) / 100}`;
};

/** Lower score = more severe. Missing readings rank first. */
const severityScore = (row: FleetPointRow): number =>
  row.actual === null || row.actual === undefined ? -1 : row.percent ?? 0;

const AnomaliesPanel = ({ rows, isLoading, onLocate }: AnomaliesPanelProps) => {
  const [page, setPage] = useState(0);

  // Under-dosed (or unread) points only: status orange/red.
  const anomalies = useMemo<FleetPointRow[]>(
    () =>
      rows
        .filter(row => row.status === 'orange' || row.status === 'red')
        .sort((a, b) => severityScore(a) - severityScore(b)),
    [rows],
  );

  const pageCount = Math.max(1, Math.ceil(anomalies.length / PAGE_SIZE));

  useEffect(() => {
    setPage(previous => Math.min(previous, pageCount - 1));
  }, [pageCount]);

  const pageItems = useMemo(
    () => anomalies.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [anomalies, page],
  );

  return (
    <section className="anomalies" aria-label="Anomalies détectées">
      <header className="anomalies__header">
        <div className="anomalies__heading">
          <span className="anomalies__tick" aria-hidden="true" />
          <h2 className="anomalies__title">
            Anomalies détectées <span className="anomalies__title-sep">·</span>{' '}
            <span className="anomalies__title-soft">Points hors tolérance</span>
          </h2>
          {anomalies.length > 0 ? (
            <span className="anomalies__count">{anomalies.length}</span>
          ) : null}
        </div>
        <p className="anomalies__subtitle">Cliquer sur une anomalie pour la localiser sur le schéma</p>
      </header>

      {isLoading && anomalies.length === 0 ? (
        <p className="anomalies__empty">Chargement des données…</p>
      ) : anomalies.length === 0 ? (
        <p className="anomalies__empty">Aucune anomalie · tous les points sont conformes.</p>
      ) : (
        <>
          <div className="anomalies__grid">
            {pageItems.map(row => {
              const ecart =
                row.actual !== null && row.actual !== undefined && row.planned && row.planned > 0
                  ? ((row.actual - row.planned) / row.planned) * 100
                  : null;
              const isMissing = row.actual === null || row.actual === undefined;
              const statusLabel = isMissing ? 'NON RELEVÉ' : 'SOUS-DOSÉ';
              const ecartText = ecart === null ? '' : `${ecart > 0 ? '+' : ''}${Math.round(ecart)}%`;

              return (
                <button
                  key={`${row.craneId}-${row.pointId}-${row.pointName}`}
                  type="button"
                  className={`anomalies__card anomalies__card--${row.status}`}
                  onClick={() => onLocate(row)}
                  aria-label={`Localiser ${row.pointName} sur le schéma`}
                >
                  <div className="anomalies__card-main">
                    <span className="anomalies__name">{row.pointName}</span>
                    <span className="anomalies__meta">
                      {row.craneName} · {row.zone}
                    </span>
                  </div>
                  <div className="anomalies__card-values">
                    <span className="anomalies__amount">
                      <strong className={`anomalies__amount-actual anomalies__amount-actual--${row.status}`}>
                        {formatAmount(row.actual)}
                      </strong>
                      <span className="anomalies__amount-sep">/</span>
                      <span className="anomalies__amount-planned">{formatAmount(row.planned)}</span>
                      <span className="anomalies__amount-unit">g</span>
                    </span>
                    <span className={`anomalies__status anomalies__status--${row.status}`}>
                      {statusLabel} {ecartText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {pageCount > 1 ? (
            <nav className="anomalies__pager" aria-label="Pagination des anomalies">
              <button
                type="button"
                className="anomalies__pager-btn"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Page précédente"
              >
                ‹
              </button>
              <span className="anomalies__pager-label">
                Page {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                className="anomalies__pager-btn"
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                aria-label="Page suivante"
              >
                ›
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
};

export default AnomaliesPanel;
