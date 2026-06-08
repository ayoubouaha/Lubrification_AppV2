import { useMemo } from 'react';
import type { FleetPointRow } from '../../../hooks/useFleetLubricationData';
import './ZoneDetailTables.css';

interface ZoneDetailTablesProps {
  rows: FleetPointRow[];
  isLoading: boolean;
}

const ZONE_ORDER = [
  'Transl. A',
  'Transl. B',
  'Transl. C',
  'Transl. D',
  'Rotation',
  'Relevage',
  'Levage',
  'Poulies',
];

interface ZoneRow {
  zone: string;
  pts: number;
  planned: number;
  actual: number;
  ecart: number | null;
}

interface CraneTable {
  craneId: string;
  craneName: string;
  zones: ZoneRow[];
}

const formatNumber = (value: number, fractionDigits = 0): string =>
  value.toLocaleString('fr-FR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

/** Amounts arrive from the backend already in grams; format without extra scaling. */
const formatGrams = (value: number): string =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const ecartClass = (ecart: number | null): string => {
  if (ecart === null) return 'zone-detail__ecart--none';
  if (ecart < 0) return 'zone-detail__ecart--red';
  if (ecart > 5) return 'zone-detail__ecart--blue';
  return 'zone-detail__ecart--green';
};

const formatEcart = (ecart: number | null): string => {
  if (ecart === null) return '—';
  const sign = ecart > 0 ? '+' : '';
  return `${sign}${formatNumber(ecart, 1)}%`;
};

const ZoneDetailTables = ({ rows, isLoading }: ZoneDetailTablesProps) => {
  const tables = useMemo<CraneTable[]>(() => {
    const perCrane = new Map<string, { craneName: string; zones: Map<string, ZoneRow> }>();

    rows.forEach(row => {
      const crane = perCrane.get(row.craneId) ?? { craneName: row.craneName, zones: new Map() };
      const zone = crane.zones.get(row.zone) ?? { zone: row.zone, pts: 0, planned: 0, actual: 0, ecart: null };

      zone.pts += 1;
      zone.planned += row.planned ?? 0;
      zone.actual += row.actual ?? 0;

      crane.zones.set(row.zone, zone);
      perCrane.set(row.craneId, crane);
    });

    return [...perCrane.entries()].map(([craneId, crane]) => {
      const zones = [...crane.zones.values()]
        .map(zone => ({
          ...zone,
          planned: Math.round(zone.planned * 100) / 100,
          actual: Math.round(zone.actual * 100) / 100,
          ecart: zone.planned > 0 ? ((zone.actual - zone.planned) / zone.planned) * 100 : null,
        }))
        .sort((a, b) => {
          const ia = ZONE_ORDER.indexOf(a.zone);
          const ib = ZONE_ORDER.indexOf(b.zone);
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

      return { craneId, craneName: crane.craneName, zones };
    });
  }, [rows]);

  return (
    <section className="zone-detail" aria-label="Détail par zone">
      <header className="zone-detail__header">
        <p className="zone-detail__eyebrow">Détail par zone</p>
        <h2 className="zone-detail__title">Consommation et écart</h2>
      </header>

      <div className="zone-detail__grid">
        {isLoading && tables.length === 0 ? (
          <p className="zone-detail__empty">Chargement des données…</p>
        ) : tables.length === 0 ? (
          <p className="zone-detail__empty">Aucune donnée disponible.</p>
        ) : (
          tables.map((table, index) => (
            <article
              key={table.craneId}
              className="zone-detail__card"
              style={{ animationDelay: `${360 + index * 120}ms` }}
            >
              <h3 className="zone-detail__crane">
                <span className="zone-detail__crane-tick" aria-hidden="true" />
                {table.craneName}
              </h3>
              <table className="zone-detail__table">
                <thead>
                  <tr>
                    <th className="zone-detail__th zone-detail__th--left">Zone</th>
                    <th className="zone-detail__th">Pts</th>
                    <th className="zone-detail__th">Prévu (g)</th>
                    <th className="zone-detail__th">Effectué (g)</th>
                    <th className="zone-detail__th">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {table.zones.map(zone => (
                    <tr key={zone.zone}>
                      <td className="zone-detail__td zone-detail__td--left">{zone.zone}</td>
                      <td className="zone-detail__td">{zone.pts}</td>
                      <td className="zone-detail__td">{formatGrams(zone.planned)}</td>
                      <td className="zone-detail__td">{formatGrams(zone.actual)}</td>
                      <td className="zone-detail__td zone-detail__td--ecart">
                        <span className={`zone-detail__ecart ${ecartClass(zone.ecart)}`}>
                          {formatEcart(zone.ecart)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default ZoneDetailTables;
