import { type ExecutionDate } from '../../../types/lubricationPoint';
import './ExecutionDateSelector.css';

interface ExecutionDateSelectorProps {
  dates: ExecutionDate[];
  selectedDate: ExecutionDate | null;
  onDateChange: (date: ExecutionDate) => void;
  selectedGraisseur: string | null;
  onGraisseurChange: (graisseur: string | null) => void;
  isLoading?: boolean;
}

const ALL_GRAISSEURS = '__all__';

const Chevron = () => (
  <svg className="exec-selector__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M4 6l4 4 4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExecutionDateSelector = ({
  dates,
  selectedDate,
  onDateChange,
  selectedGraisseur,
  onGraisseurChange,
  isLoading,
}: ExecutionDateSelectorProps) => {
  if (isLoading && dates.length === 0) {
    return (
      <div className="exec-selector exec-selector--loading" aria-hidden="true">
        <span className="exec-selector__skeleton" />
        <span className="exec-selector__skeleton" />
      </div>
    );
  }

  if (dates.length === 0) {
    return null;
  }

  const graisseurs = selectedDate?.graisseurs ?? [];

  return (
    <div className="exec-selector">
      <div className="exec-selector__field">
        <label className="exec-selector__label" htmlFor="fleet-date-select">
          Date Exécutée
        </label>
        <div className="exec-selector__control">
          <select
            id="fleet-date-select"
            className="exec-selector__select"
            value={selectedDate?.date ?? ''}
            onChange={event => {
              const next = dates.find(d => d.date === event.target.value);
              if (next) onDateChange(next);
            }}
          >
            {dates.map(date => (
              <option key={date.date} value={date.date}>
                {date.label}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>

      <div className="exec-selector__field">
        <label className="exec-selector__label" htmlFor="fleet-graisseur-select">
          Graisseur
        </label>
        <div className="exec-selector__control">
          <select
            id="fleet-graisseur-select"
            className="exec-selector__select"
            value={selectedGraisseur ?? ALL_GRAISSEURS}
            disabled={graisseurs.length === 0}
            onChange={event => {
              const value = event.target.value;
              onGraisseurChange(value === ALL_GRAISSEURS ? null : value);
            }}
          >
            <option value={ALL_GRAISSEURS}>Tous les graisseurs</option>
            {graisseurs.map(graisseur => (
              <option key={graisseur.name} value={graisseur.name}>
                {graisseur.name} ({graisseur.eventCount})
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>

    </div>
  );
};

export default ExecutionDateSelector;
