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

export const resolveLubricationStatus = (
  actualAmount: number | null | undefined,
  plannedAmount: number | null | undefined,
): LubricationStatus => {
  if (actualAmount === null || actualAmount === undefined) {
    return 'red';
  }

  if (plannedAmount === null || plannedAmount === undefined || plannedAmount <= 0) {
    return 'green';
  }

  if (actualAmount >= plannedAmount) {
    return 'green';
  }

  const gapPercent = ((plannedAmount - actualAmount) / plannedAmount) * 100;
  if (gapPercent > 50) {
    return 'red';
  }

  if (gapPercent > 10) {
    return 'orange';
  }

  return 'green';
};

export const computeLubricationPercentValue = (
  actualAmount: number | null | undefined,
  plannedAmount: number | null | undefined,
): number | null => {
  if (actualAmount === null || actualAmount === undefined) {
    return null;
  }

  if (plannedAmount === null || plannedAmount === undefined || plannedAmount <= 0) {
    return 100;
  }

  if (actualAmount >= plannedAmount) {
    return 100;
  }

  return (actualAmount / plannedAmount) * 100;
};
