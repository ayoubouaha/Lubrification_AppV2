import { type LubricationFetchStatus, type LubricationPointDto } from '../../../types/lubricationPoint';

interface LubricationInfoCardProps {
  identifiers: string[];
  frequency: string;
  plannedAmount: string;
  liveData: LubricationPointDto | null;
  status: LubricationFetchStatus;
  errorMessage: string;
  onRetry: () => void;
}

const formatInterval = (interval: number | null): string => {
  if (interval === null || interval === undefined) {
    return '';
  }

  return `${interval} jours`;
};

// The backend already returns amounts in grams (it divides the raw x1000 source
// value by 1000). So we only format here and append the unit — no extra scaling.
const formatGrams = (value: number | null): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const formatted = Number.isInteger(value)
    ? `${value}`
    : value
        .toFixed(3)
        .replace(/(\.\d*?)0+$/, '$1')
        .replace(/\.$/, '');

  return `${formatted} g`;
};

const formatPercentage = (value: number): string => {
  if (Number.isInteger(value)) {
    return `${value}%`;
  }

  const formatted = value
    .toFixed(1)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');

  return `${formatted}%`;
};

const computeLubricationPercent = (actualAmount: number | null, plannedAmount: number | null): string => {
  if (actualAmount === null || actualAmount === undefined) {
    return 'N/A';
  }

  if (plannedAmount === null || plannedAmount <= 0) {
    return '100%';
  }

  if (actualAmount >= plannedAmount) {
    return '100%';
  }

  const ratio = (actualAmount / plannedAmount) * 100;
  return formatPercentage(ratio);
};

const hasStaticValues = (frequency: string, plannedAmount: string): boolean => {
  return Boolean(frequency.trim() || plannedAmount.trim());
};

const LubricationInfoCard = ({
  identifiers,
  frequency,
  plannedAmount,
  liveData,
  status,
  errorMessage,
  onRetry,
}: LubricationInfoCardProps) => {
  const liveFrequency = formatInterval(liveData?.interval ?? null);
  const livePlannedAmount = formatGrams(liveData?.plannedAmount ?? null);
  const liveActualAmount = formatGrams(liveData?.actualAmount ?? null);
  const displayFrequency = liveFrequency || frequency;
  const displayPlannedAmount = livePlannedAmount;
  const isLoading = status === 'loading';
  const plannedAmountValue = liveData?.plannedAmount ?? null;
  const lubricationPercent = computeLubricationPercent(liveData?.actualAmount ?? null, plannedAmountValue);

  return (
    <>
      {identifiers.length ? (
        <section className="interactive-diagram__popup-section">
          <p className="interactive-diagram__popup-section-title">Identifiants</p>
          <ul className="interactive-diagram__popup-list">
            {identifiers.map(identifier => (
              <li key={identifier} className="interactive-diagram__popup-value">
                {identifier}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="interactive-diagram__popup-section">
        <p className="interactive-diagram__popup-section-title">Fréquence</p>
        {isLoading ? (
          <span className="interactive-diagram__popup-skeleton" />
        ) : (
          <p className="interactive-diagram__popup-value">{displayFrequency || 'N/A'}</p>
        )}
      </section>

      <section className="interactive-diagram__popup-section">
        <p className="interactive-diagram__popup-section-title">Quantité planifiée</p>
        {isLoading ? (
          <span className="interactive-diagram__popup-skeleton" />
        ) : (
          <p className="interactive-diagram__popup-value">{displayPlannedAmount || 'N/A'}</p>
        )}
      </section>

      <section className="interactive-diagram__popup-section">
        <p className="interactive-diagram__popup-section-title">Quantité réelle</p>
        {isLoading ? (
          <span className="interactive-diagram__popup-skeleton" />
        ) : (
          <p className="interactive-diagram__popup-value">{liveActualAmount}</p>
        )}
      </section>

      <section className="interactive-diagram__popup-section">
        <p className="interactive-diagram__popup-section-title">Pourcentage de graissage</p>
        {isLoading ? (
          <span className="interactive-diagram__popup-skeleton" />
        ) : (
          <p className="interactive-diagram__popup-value">{lubricationPercent}</p>
        )}
      </section>

      {status === 'error' && hasStaticValues(frequency, plannedAmount) ? (
        <p className="interactive-diagram__popup-error">
          Données temps réel indisponibles.{' '}
          <button type="button" className="interactive-diagram__popup-retry" onClick={onRetry}>
            Réessayer
          </button>
          {errorMessage ? ` (${errorMessage})` : ''}
        </p>
      ) : null}
    </>
  );
};

export default LubricationInfoCard;
