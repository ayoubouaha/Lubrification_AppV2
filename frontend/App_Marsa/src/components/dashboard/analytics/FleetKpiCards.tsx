import { useMemo } from 'react';
import { Droplets, Target, Scale, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { FleetPointRow } from '../../../hooks/useFleetLubricationData';
import { useCountUp } from '../../../hooks/useCountUp';
import './FleetKpiCards.css';

interface FleetKpiCardsProps {
  rows: FleetPointRow[];
  isLoading: boolean;
}

type Accent = 'green' | 'orange' | 'blue' | 'red';

interface KpiCard {
  key: string;
  label: string;
  topRight: string;
  rawValue: number;
  decimals: number;
  unit?: string;
  footnote: string;
  accent: Accent;
  icon: LucideIcon;
}

const formatNumber = (value: number, fractionDigits = 0): string =>
  value.toLocaleString('fr-FR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const KpiCardView = ({ card, index, isLoading }: { card: KpiCard; index: number; isLoading: boolean }) => {
  const animated = useCountUp(card.rawValue);
  const Icon = card.icon;

  return (
    <article
      role="listitem"
      className={`fleet-kpi fleet-kpi--${card.accent}`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span className="fleet-kpi__bar" aria-hidden="true" />
      <header className="fleet-kpi__head">
        <span className="fleet-kpi__label">{card.label}</span>
        <span className="fleet-kpi__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </header>
      <p className="fleet-kpi__value">
        {isLoading ? '—' : formatNumber(animated, card.decimals)}
        {card.unit ? <span className="fleet-kpi__unit">{card.unit}</span> : null}
      </p>
      <p className="fleet-kpi__footnote">{card.footnote}</p>
      <span className="fleet-kpi__topright">{card.topRight}</span>
    </article>
  );
};

const FleetKpiCards = ({ rows, isLoading }: FleetKpiCardsProps) => {
  const cards = useMemo<KpiCard[]>(() => {
    const total = rows.length;
    const greased = rows.filter(row => row.actual !== null && row.actual > 0).length;
    const green = rows.filter(row => row.status === 'green').length;
    const orange = rows.filter(row => row.status === 'orange').length;
    const red = rows.filter(row => row.status === 'red').length;
    const outOfTolerance = orange + red;

    const totalActual = rows.reduce((sum, row) => sum + (row.actual ?? 0), 0);
    const totalPlanned = rows.reduce((sum, row) => sum + (row.planned ?? 0), 0);

    const coveragePct = total ? (greased / total) * 100 : 0;
    const conformityPct = total ? (green / total) * 100 : 0;
    const ecartPct = totalPlanned ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0;
    const ecartSign = ecartPct > 0 ? '+' : '';

    return [
      {
        key: 'coverage',
        label: 'Points graissés',
        topRight: `${greased}/${total}`,
        rawValue: coveragePct,
        decimals: 0,
        unit: '%',
        footnote:
          total - greased === 0 ? 'Couverture du plan · aucun point oublié' : `${total - greased} point(s) sans relevé`,
        accent: 'green',
        icon: Droplets,
      },
      {
        key: 'conformity',
        label: 'Conformité dosage',
        topRight: 'Écart toléré ≤ 10 %',
        rawValue: conformityPct,
        decimals: 1,
        unit: '%',
        footnote: `${green} conformes · ${outOfTolerance} hors tolérance`,
        accent: 'orange',
        icon: Target,
      },
      {
        key: 'grease',
        label: 'Graisse utilisée',
        topRight: 'Total flotte',
        rawValue: totalActual / 1000,
        decimals: 2,
        unit: 'kg',
        footnote: `Prévu ${formatNumber(totalPlanned / 1000, 2)} kg · écart ${ecartSign}${formatNumber(ecartPct, 1)} %`,
        accent: 'blue',
        icon: Scale,
      },
      {
        key: 'anomalies',
        label: 'Anomalies',
        topRight: 'Points critiques',
        rawValue: red,
        decimals: 0,
        footnote: red === 0 ? 'Aucune anomalie · tout est conforme' : 'À investiguer en priorité',
        accent: 'red',
        icon: TriangleAlert,
      },
    ];
  }, [rows]);

  return (
    <div className="fleet-kpis" role="list" aria-label="Indicateurs clés de la flotte">
      {cards.map((card, index) => (
        <KpiCardView key={card.key} card={card} index={index} isLoading={isLoading} />
      ))}
    </div>
  );
};

export default FleetKpiCards;
