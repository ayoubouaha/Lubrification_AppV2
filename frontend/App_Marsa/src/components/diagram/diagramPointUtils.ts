import { type DiagramPoint } from './types';
import { type LubricationPointDto } from '../../types/lubricationPoint';

const K3_IDENTIFIER_PATTERN = /^(K3|T2)-(STR|SROT|FLECHE|SLEV|POULIE)-[A-Z0-9-]+$/i;
const DB_IDENTIFIER_PATTERN = /^[A-Z0-9-]+$/i;

const extractFirstK3Identifier = (value: string): string | null => {
  const candidates = value
    .split(/\s*\/\s*|\r?\n|\s*,\s*/)
    .map(token => token.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    if (K3_IDENTIFIER_PATTERN.test(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getDbName = (point?: DiagramPoint | null): string | null => {
  if (!point) {
    return null;
  }

  if (point.dbName?.trim() && DB_IDENTIFIER_PATTERN.test(point.dbName.trim())) {
    return point.dbName.trim();
  }

  if (point.tagPrimary) {
    const identifier = extractFirstK3Identifier(point.tagPrimary);
    if (identifier) {
      return identifier;
    }
  }

  if (point.tagSecondary) {
    const identifier = extractFirstK3Identifier(point.tagSecondary);
    if (identifier) {
      return identifier;
    }
  }

  const normalizedName = point.name.trim();
  if (K3_IDENTIFIER_PATTERN.test(normalizedName)) {
    return normalizedName;
  }

  return null;
};

export const getDbNameCandidates = (point?: DiagramPoint | null): string[] => {
  if (!point) {
    return [];
  }

  const candidates = new Set<string>();
  const dbName = getDbName(point);
  if (dbName) {
    candidates.add(dbName);
  }

  const rawIdentifiers = [point.tagPrimary, point.tagSecondary].filter(Boolean).join(' / ');
  if (rawIdentifiers.trim()) {
    rawIdentifiers
      .split(/\s*\/\s*|\r?\n|\s*,\s*/)
      .map(value => value.trim())
      .filter(Boolean)
      .forEach(identifier => {
        if (K3_IDENTIFIER_PATTERN.test(identifier)) {
          candidates.add(identifier);
        }
      });
  }

  return [...candidates];
};

const clampPercent = (value: number): number => Math.max(0, Math.min(97, value));

/**
 * Splits any marker that represents several lubrication points into one marker per point, so each
 * position carries a single point. A point's identifiers are read with {@link getDbNameCandidates}
 * (handles both `tagSecondary` and `" / "`-joined `tagPrimary`, e.g. translation A19/A20 or the
 * 4-up poulies markers). The resulting markers are spread horizontally and **centered on the
 * original position** with a small `gapXPercent` between neighbours, so the original shifts a
 * little left and the others tuck in close — visually associated but clearly separated. Markers
 * with one (or no) identifier pass through unchanged.
 */
export const expandSinglePointMarkers = (
  points: DiagramPoint[],
  gapXPercent = 3,
): DiagramPoint[] => {
  const result: DiagramPoint[] = [];

  for (const point of points) {
    const ids = getDbNameCandidates(point);

    if (ids.length <= 1) {
      // Drop a stray secondary tag if present, otherwise keep the marker as-is.
      result.push(point.tagSecondary ? { ...point, tagSecondary: undefined } : point);
      continue;
    }

    // When the name is just the tag string (translation / poulies), use the single id; keep
    // descriptive names (e.g. K3 "Biellette inferieure gauche") untouched.
    const nameIsTags = point.name?.trim() === ids.join(' / ');
    // Center the spread on the original x: e.g. 2 points land at x - gap/2 and x + gap/2.
    const gap = point.splitGapXPercent ?? gapXPercent;
    const centerShift = (ids.length - 1) / 2;

    ids.forEach((id, index) => {
      result.push({
        ...point,
        id: index === 0 ? point.id : `${point.id}-${index + 1}`,
        name: nameIsTags ? id : point.name,
        tagPrimary: id,
        tagSecondary: undefined,
        dbName: id,
        xPercent: clampPercent(point.xPercent + (index - centerShift) * gap),
      });
    });
  }

  return result;
};

export const pickLubricationData = (
  map: Map<string, LubricationPointDto> | undefined,
  candidates: string[],
): LubricationPointDto | null => {
  if (!map || !candidates.length) return null;

  for (const name of candidates) {
    const candidate = map.get(name);
    if (candidate) return candidate;
  }

  return null;
};

export const isCriticalLubricationPoint = (data: LubricationPointDto | null | undefined): boolean => {
  if (!data) return false;

  const actual = data.actualAmount;
  const planned = data.plannedAmount;

  if (actual === null || actual === undefined) {
    return true;
  }

  if (planned === null || planned === undefined || planned <= 0) {
    return false;
  }

  return actual < planned * 0.5;
};

export type LubricationStatus = 'green' | 'orange' | 'red';

export const STATUS_RGB: Record<LubricationStatus, string> = {
  green: '34, 197, 94',
  orange: '245, 158, 11',
  red: '239, 68, 68',
};

/**
 * Fine-grained dosage grade, based on Écart = ((Effectué - Prévu) / Prévu) × 100:
 *   écart > +10%          -> surdose  (over-dosed)       — blue
 *   -10% <= écart <= +10% -> conforme (on target)        — green
 *   -50% <= écart < -10%  -> sousdose (under-dosed)       — orange
 *   écart < -50% (or effectué <= 0) -> critique           — red
 */
export type LubricationGrade = 'conforme' | 'surdose' | 'sousdose' | 'critique';

export const GRADE_RGB: Record<LubricationGrade, string> = {
  conforme: '34, 197, 94', // green
  surdose: '59, 130, 246', // blue
  sousdose: '245, 158, 11', // orange
  critique: '239, 68, 68', // red
};

export const GRADE_LABEL: Record<LubricationGrade, string> = {
  conforme: 'Conforme',
  surdose: 'Sur-dosé',
  sousdose: 'Sous-dosé',
  critique: 'Critique',
};

export const resolveLubricationGrade = (
  actualAmount: number | null | undefined,
  plannedAmount: number | null | undefined,
): LubricationGrade => {
  // No grease applied (missing, or effectué = 0) -> critique.
  if (actualAmount === null || actualAmount === undefined || actualAmount <= 0) {
    return 'critique';
  }

  // No planned amount to compare against -> on target by default.
  if (plannedAmount === null || plannedAmount === undefined || plannedAmount <= 0) {
    return 'conforme';
  }

  const ecart = ((actualAmount - plannedAmount) / plannedAmount) * 100;
  if (ecart > 10) {
    return 'surdose';
  }
  if (ecart >= -10) {
    return 'conforme';
  }
  if (ecart >= -50) {
    return 'sousdose';
  }
  return 'critique';
};

const GRADE_TO_STATUS: Record<LubricationGrade, LubricationStatus> = {
  conforme: 'green',
  surdose: 'green',
  sousdose: 'orange',
  critique: 'red',
};

/**
 * Coarse 3-bucket status (green/orange/red) used by KPI counts, the anomalies panel and the status
 * CSS classes. Derived from {@link resolveLubricationGrade}: conforme + sur-dosé are both green,
 * sous-dosé is orange, critique is red.
 */
export const resolveLubricationStatus = (
  actualAmount: number | null | undefined,
  plannedAmount: number | null | undefined,
): LubricationStatus => GRADE_TO_STATUS[resolveLubricationGrade(actualAmount, plannedAmount)];

export const computeLubricationPercentValue = (
  actualAmount: number | null | undefined,
  plannedAmount: number | null | undefined,
): number | null => {
  if (actualAmount === null || actualAmount === undefined) {
    return null;
  }

  // No grease applied -> 0 % (keeps the bar/percent consistent with the red status).
  if (actualAmount <= 0) {
    return 0;
  }

  if (plannedAmount === null || plannedAmount === undefined || plannedAmount <= 0) {
    return 100;
  }

  if (actualAmount >= plannedAmount) {
    return 100;
  }

  return (actualAmount / plannedAmount) * 100;
};
