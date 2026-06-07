import { useSyncFreshness } from '../../../hooks/useSyncFreshness';
import './SyncFreshnessBadge.css';

const formatDateTime = (ms: number): string => {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} à ${time}`;
};

const SyncFreshnessBadge = () => {
  const { lastSyncedAtMs, online } = useSyncFreshness();

  const value = !online
    ? 'Hors ligne'
    : lastSyncedAtMs !== null
      ? formatDateTime(lastSyncedAtMs)
      : 'En attente…';

  return (
    <div className="sync-badge" role="status" aria-live="polite">
      <span className="sync-badge__label">Dernière synchronisation</span>
      <span className={`sync-badge__value ${!online ? 'sync-badge__value--offline' : ''}`}>
        {value}
      </span>
    </div>
  );
};

export default SyncFreshnessBadge;
