import { useMemo } from 'react';
import type { FleetPointRow } from '../../../hooks/useFleetLubricationData';
import './AnalysisChartsPanel.css';

interface AnalysisChartsPanelProps {
  rows: FleetPointRow[];
  isLoading: boolean;
}

type AmountKind = 'planned' | 'actual';

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

const CRANE_COLORS: Record<string, { prevu: string; effectue: string }> = {
  K3: { prevu: '#c8962e', effectue: '#f5a623' },
  T2: { prevu: '#1f4e79', effectue: '#5ba3e0' },
};
const FALLBACK_COLOR = { prevu: '#64748b', effectue: '#94a3b8' };

/** Écart buckets for the distribution histogram, with their colours. */
const BUCKETS: { label: string; color: string; test: (ecart: number) => boolean }[] = [
  { label: '< -50%', color: '#ef4444', test: e => e < -50 },
  { label: '-50/-10%', color: '#f97316', test: e => e >= -50 && e < -10 },
  { label: '-10/0%', color: '#22c55e', test: e => e >= -10 && e < 0 },
  { label: '0/+5%', color: '#22c55e', test: e => e >= 0 && e < 5 },
  { label: '+5/+10%', color: '#22c55e', test: e => e >= 5 && e < 10 },
  { label: '+10/+15%', color: '#f59e0b', test: e => e >= 10 && e <= 15 },
  { label: '> +15%', color: '#3b82f6', test: e => e > 15 },
];

const craneShort = (name: string): string => name.split(' ')[0] || name;

/** Nice axis maximum + step so gridlines land on round numbers. */
const niceAxis = (max: number, ticks = 6): { max: number; step: number } => {
  if (max <= 0) return { max: 1, step: 1 };
  const rawStep = max / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / pow;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow;
  return { max: Math.ceil(max / step) * step, step };
};

const buildTicks = (max: number, step: number): number[] => {
  const ticks: number[] = [];
  for (let t = 0; t <= max + step / 1000; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return ticks;
};

const ConsumptionChart = ({
  zones,
  cranes,
  get,
}: {
  zones: string[];
  cranes: string[];
  get: (zone: string, crane: string, kind: AmountKind) => number;
}) => {
  const W = 720;
  const H = 320;
  const PAD = { top: 10, right: 14, bottom: 38, left: 56 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const series = cranes.flatMap(crane => {
    const color = CRANE_COLORS[crane] ?? FALLBACK_COLOR;
    return [
      { key: `${crane}-p`, label: `${crane} prévu`, color: color.prevu, crane, kind: 'planned' as const },
      { key: `${crane}-e`, label: `${crane} effectué`, color: color.effectue, crane, kind: 'actual' as const },
    ];
  });

  const maxVal = Math.max(1, ...zones.flatMap(zone => series.map(s => get(zone, s.crane, s.kind))));
  const axis = niceAxis(maxVal);
  const yFor = (value: number) => PAD.top + (1 - value / axis.max) * plotH;

  const groupW = plotW / zones.length;
  const innerW = groupW * 0.74;
  const barW = innerW / series.length;

  return (
    <>
      <ul className="analysis-chart__legend">
        {series.map(s => (
          <li key={s.key} className="analysis-chart__legend-item">
            <span className="analysis-chart__swatch" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>
      <svg className="analysis-chart__svg" viewBox={`0 0 ${W} ${H}`} role="img">
        {buildTicks(axis.max, axis.step).map(tick => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="analysis-chart__grid" />
              <text x={PAD.left - 8} y={y + 3} className="analysis-chart__ylabel">
                {tick} g
              </text>
            </g>
          );
        })}
        {zones.map((zone, zi) => {
          const groupX = PAD.left + zi * groupW + (groupW - innerW) / 2;
          return (
            <g key={zone}>
              {series.map((s, si) => {
                const value = get(zone, s.crane, s.kind);
                const y = yFor(value);
                const height = Math.max(0, PAD.top + plotH - y);
                return (
                  <rect key={s.key} x={groupX + si * barW} y={y} width={barW * 0.86} height={height} fill={s.color} rx={1}>
                    <title>{`${zone} · ${s.label} : ${Math.round(value)} g`}</title>
                  </rect>
                );
              })}
              <text x={PAD.left + zi * groupW + groupW / 2} y={H - 14} className="analysis-chart__xlabel">
                {zone}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );
};

const DistributionChart = ({ buckets }: { buckets: { label: string; color: string; value: number }[] }) => {
  const W = 720;
  const H = 320;
  const PAD = { top: 10, right: 14, bottom: 38, left: 40 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(1, ...buckets.map(b => b.value));
  const axis = niceAxis(maxVal);
  const yFor = (value: number) => PAD.top + (1 - value / axis.max) * plotH;

  const slot = plotW / buckets.length;
  const barW = slot * 0.6;

  return (
    <svg className="analysis-chart__svg" viewBox={`0 0 ${W} ${H}`} role="img">
      {buildTicks(axis.max, axis.step).map(tick => {
        const y = yFor(tick);
        return (
          <g key={tick}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="analysis-chart__grid" />
            <text x={PAD.left - 8} y={y + 3} className="analysis-chart__ylabel">
              {tick}
            </text>
          </g>
        );
      })}
      {buckets.map((bucket, bi) => {
        const cx = PAD.left + bi * slot + slot / 2;
        const y = yFor(bucket.value);
        const height = Math.max(0, PAD.top + plotH - y);
        return (
          <g key={bucket.label}>
            <rect x={cx - barW / 2} y={y} width={barW} height={height} fill={bucket.color} rx={2}>
              <title>{`${bucket.label} : ${bucket.value} points`}</title>
            </rect>
            <text x={cx} y={H - 14} className="analysis-chart__xlabel">
              {bucket.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const AnalysisChartsPanel = ({ rows, isLoading }: AnalysisChartsPanelProps) => {
  const { zones, cranes, get } = useMemo(() => {
    const map = new Map<string, Map<string, { planned: number; actual: number }>>();
    const craneSet = new Set<string>();

    rows.forEach(row => {
      const crane = craneShort(row.craneName);
      craneSet.add(crane);
      let zoneMap = map.get(row.zone);
      if (!zoneMap) {
        zoneMap = new Map();
        map.set(row.zone, zoneMap);
      }
      let agg = zoneMap.get(crane);
      if (!agg) {
        agg = { planned: 0, actual: 0 };
        zoneMap.set(crane, agg);
      }
      agg.planned += row.planned ?? 0;
      agg.actual += row.actual ?? 0;
    });

    const known = ZONE_ORDER.filter(zone => map.has(zone));
    const extra = [...map.keys()].filter(zone => !ZONE_ORDER.includes(zone));
    const get = (zone: string, crane: string, kind: AmountKind): number =>
      map.get(zone)?.get(crane)?.[kind] ?? 0;

    return { zones: [...known, ...extra], cranes: [...craneSet].sort(), get };
  }, [rows]);

  const distribution = useMemo(() => {
    const buckets = BUCKETS.map(bucket => ({ label: bucket.label, color: bucket.color, value: 0 }));
    let total = 0;
    rows.forEach(row => {
      const planned = row.planned ?? 0;
      const actual = row.actual ?? 0;
      if (planned <= 0 || actual <= 0) return;
      const ecart = ((actual - planned) / planned) * 100;
      const index = BUCKETS.findIndex(bucket => bucket.test(ecart));
      if (index >= 0) {
        buckets[index].value += 1;
        total += 1;
      }
    });
    return { buckets, total };
  }, [rows]);

  return (
    <section className="analysis" aria-label="Analyse consommation et distribution">
      <header className="analysis__header">
        <p className="analysis__eyebrow">Analyse · Consommation &amp; Distribution</p>
      </header>

      <div className="analysis__grid">
        <article className="analysis-card">
          <h3 className="analysis-card__title">Consommation par zone fonctionnelle</h3>
          <p className="analysis-card__subtitle">Grammes EP2 · prévu vs effectué</p>
          {isLoading && !zones.length ? (
            <p className="analysis-card__empty">Chargement des données…</p>
          ) : !zones.length ? (
            <p className="analysis-card__empty">Aucune donnée disponible.</p>
          ) : (
            <ConsumptionChart zones={zones} cranes={cranes} get={get} />
          )}
        </article>

        <article className="analysis-card">
          <h3 className="analysis-card__title">Distribution des écarts</h3>
          <p className="analysis-card__subtitle">% écart par point · {distribution.total} points</p>
          {isLoading && !distribution.total ? (
            <p className="analysis-card__empty">Chargement des données…</p>
          ) : !distribution.total ? (
            <p className="analysis-card__empty">Aucune donnée disponible.</p>
          ) : (
            <DistributionChart buckets={distribution.buckets} />
          )}
        </article>
      </div>
    </section>
  );
};

export default AnalysisChartsPanel;
