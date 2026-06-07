import { useEffect, useState } from 'react';
import { fetchExecutionDates } from '../services/lubricationApi';
import { type ExecutionDate } from '../types/lubricationPoint';

interface UseExecutionDatesResult {
  dates: ExecutionDate[];
  selectedDate: ExecutionDate | null;
  setSelectedDate: (date: ExecutionDate) => void;
  /** Selected graisseur name, or null for "Tous les graisseurs". */
  selectedGraisseur: string | null;
  setSelectedGraisseur: (graisseur: string | null) => void;
  hasLoaded: boolean;
}

/**
 * Loads the available execution dates once and tracks the selected date (defaulting to the most
 * recent). The graisseur is auto-selected to the date's main (most active) graisseur so it never
 * has to be picked by hand; the user can still override it (including "Tous").
 */
export const useExecutionDates = (): UseExecutionDatesResult => {
  const [dates, setDates] = useState<ExecutionDate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGraisseur, setSelectedGraisseur] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchExecutionDates(controller.signal)
      .then(result => {
        setDates(result);
        // Default to the most recent date and auto-select its main graisseur.
        const initial = result[0] ?? null;
        setSelectedId(initial?.date ?? null);
        setSelectedGraisseur(initial?.graisseurs[0]?.name ?? null);
      })
      .catch(() => {
        // Leave dates empty; the dashboard shows its loading/empty state.
      })
      .finally(() => setHasLoaded(true));

    return () => controller.abort();
  }, []);

  const selectedDate = dates.find(d => d.date === selectedId) ?? null;

  return {
    dates,
    selectedDate,
    setSelectedDate: (date: ExecutionDate) => {
      setSelectedId(date.date);
      // Auto-select the date's main graisseur instead of forcing a manual pick.
      setSelectedGraisseur(date.graisseurs[0]?.name ?? null);
    },
    selectedGraisseur,
    setSelectedGraisseur,
    hasLoaded,
  };
};
