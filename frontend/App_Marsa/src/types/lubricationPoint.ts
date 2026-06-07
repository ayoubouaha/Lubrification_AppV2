export interface LubricationPointDto {
  name: string;
  interval: number | null;
  plannedAmount: number | null;
  actualAmount: number | null;
  actualDate: string | null;
  lubricator: string | null;
}

/** A graisseur (lubricator) that worked on a given execution date. */
export interface GraisseurOption {
  /** Lubricator name as recorded in the source data. */
  name: string;
  /** Number of events this graisseur performed on the date. */
  eventCount: number;
}

/** A distinct execution date (ActualDate) the dashboard can be filtered to. */
export interface ExecutionDate {
  /** ISO date (yyyy-MM-dd), also used as the stable id. */
  date: string;
  /** Human-readable label, e.g. "22-05-2026". */
  label: string;
  /** Total number of lubrication events recorded on the date. */
  totalEventCount: number;
  /** Graisseurs that worked on the date, most active first. */
  graisseurs: GraisseurOption[];
}

export type LubricationFetchStatus = 'idle' | 'loading' | 'success' | 'error';
