import { useMemo } from 'react';
import type { ConformityTrendPoint } from '../../../hooks/useConformityTrend';
import './ConformityTrendChart.css';

interface ConformityTrendChartProps {
  points: ConformityTrendPoint[];
  isLoading: boolean;
}

const W = 760;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 34, left: 38 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** Conformité is "good" -> green line, matching the status colors. */
const LINE_RGB = '34, 197, 94';

const xFor = (index: number, count: number): number =>
  PAD.left + (count <= 1 ? PLOT_W / 2 : (index / (count - 1)) * PLOT_W);

const yFor = (value: number): number => PAD.top + (1 - value / 100) * PLOT_H;

const ConformityTrendChart = ({ points, isLoading }: ConformityTrendChartProps) => {
  const valued = useMemo(
    () => points.filter((point): point is Required<ConformityTrendPoint> => point.value !== null),
    [points],
  );

  const average = useMemo(() => {
    if (!valued.length) return null;
    return valued.reduce((sum, point) => sum + point.value, 0) / valued.length;
  }, [valued]);

  const linePath = useMemo(() => {
    let path = '';
    let connected = false;
    points.forEach((point, index) => {
      if (point.value === null) {
        connected = false;
        return;
      }
      const x = xFor(index, points.length);
      const y = yFor(point.value);
      path += `${connected ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
      connected = true;
    });
    return path.trim();
  }, [points]);

  const last = valued[valued.length - 1] ?? null;

  return (
    <section className="trend-chart" aria-label="Tendance de la conformité dosage">
      <header className="trend-chart__header">
        <div>
          <p className="trend-chart__eyebrow">Tendance</p>
          <h2 className="trend-chart__title">Conformité dosage</h2>
        </div>
        {last ? (
          <span className="trend-chart__current">
            {last.value.toFixed(1)}
            <span className="trend-chart__current-unit"> %</span>
            <span className="trend-chart__current-date">au {last.label}</span>
          </span>
        ) : null}
      </header>

      {isLoading && points.length === 0 ? (
        <p className="trend-chart__empty">Chargement de la tendance…</p>
      ) : valued.length < 2 ? (
        <p className="trend-chart__empty">Pas assez de données pour afficher une tendance.</p>
      ) : (
        <svg className="trend-chart__svg" viewBox={`0 0 ${W} ${H}`} role="img">
          {[0, 25, 50, 75, 100].map(tick => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} className="trend-chart__grid" />
                <text x={PAD.left - 8} y={y + 3} className="trend-chart__ylabel">
                  {tick}
                </text>
              </g>
            );
          })}

          {average !== null ? (
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(average)}
              y2={yFor(average)}
              className="trend-chart__avg"
            >
              <title>Moyenne {average.toFixed(1)} %</title>
            </line>
          ) : null}

          <path d={linePath} className="trend-chart__line" style={{ stroke: `rgb(${LINE_RGB})` }} />

          {points.map((point, index) => {
            const x = xFor(index, points.length);
            const isLast = index === points.length - 1;
            return (
              <g key={point.date}>
                {point.value !== null ? (
                  <circle
                    cx={x}
                    cy={yFor(point.value)}
                    r={isLast ? 4.5 : 3}
                    className={`trend-chart__dot ${isLast ? 'trend-chart__dot--last' : ''}`}
                    style={{ fill: `rgb(${LINE_RGB})` }}
                  >
                    <title>
                      {point.label} · {point.value.toFixed(1)} %
                    </title>
                  </circle>
                ) : null}
                <text x={x} y={H - 12} className="trend-chart__xlabel">
                  {point.label.slice(0, 5)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
};

export default ConformityTrendChart;
