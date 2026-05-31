# Fleet Overview Charts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: use executing-plans skill to implement this plan task-by-task.

**Goal:** Add four current-state Chart.js charts (status donut, critical-by-crane bar, planned-vs-actual bar, avg % gauge) to the landing dashboard, aggregating live data across all cranes that have data.

**Architecture:** A crane-agnostic aggregation hook (`useFleetLubricationData`) reuses the existing `buildEntries` logic (extracted to a shared module) and the existing `useLubricationPointBatch` polling over `/api/lubrication/latest/{name}`. Dumb chart components receive pre-shaped data from a container panel rendered inside `GrueDashboard`. Theming reuses the app's CSS variables and status colors.

**Tech Stack:** React 19, TypeScript, Vite, `chart.js` + `react-chartjs-2`. Frontend-only — no backend changes.

**Working dir for all commands:** `frontend/App_Marsa`.

---

### Task 1: Add charting dependencies

**Files:**
- Modify: `frontend/App_Marsa/package.json` (via npm)

**Step 1: Install**

```bash
cd "D:/Lubricayion V2/Lubrification_AppV2/frontend/App_Marsa"
npm install chart.js react-chartjs-2
```

**Step 2: Verify**

```bash
npm ls chart.js react-chartjs-2
```

Expected: both resolve with a version, no `UNMET DEPENDENCY`.

---

### Task 2: Add shared status helpers + color constants

Add a single source of truth for status color RGB strings and a status/percent resolver, mirroring the existing thresholds in `DiagramMarker.resolveMarkerColor`.

**Files:**
- Modify: `frontend/App_Marsa/src/components/diagram/diagramPointUtils.ts`

**Step 1: Append to the end of `diagramPointUtils.ts`**

```typescript
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
```

**Step 2: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 3: Extract `buildEntries` into a shared crane-agnostic module

Move the entry-building logic out of `CriticalPointsPanel` so both it and the new hook share it. Behavior must stay identical.

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/fleetEntries.ts`
- Modify: `frontend/App_Marsa/src/components/dashboard/CriticalPointsPanel/CriticalPointsPanel.tsx`

**Step 1: Create `fleetEntries.ts`** (move the code currently in `CriticalPointsPanel.tsx` lines for `CriticalPointEntry`, `ZONE_KEYS`, `TUKAN_ZONE_POINTS`, `makeLabel`, `buildEntries`):

```typescript
import { type CraneImages } from '../../../config/cranesConfig';
import { type DiagramPoint } from '../../diagram/types';
import { type ZoneKey, getZoneDiagramConfig } from '../../diagram/zones/zoneDiagram.config';
import {
  ROTATION_DRIVE_GROUPS_LEFT_POINTS,
  ROTATION_DRIVE_GROUPS_RIGHT_POINTS,
} from '../../diagram/rotation/rotationDriveGroups.config';
import {
  TUKAN_ROTATION_DRIVE_GROUPS_LEFT_POINTS,
  TUKAN_ROTATION_DRIVE_GROUPS_RIGHT_POINTS,
} from '../../diagram/rotation/rotationDriveGroups.tukan.config';
import { RELEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/relevage/relevageDriveGroups.config';
import { TUKAN_RELEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/relevage/relevageDriveGroups.tukan.config';
import { LEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/levage/levageDriveGroups.config';
import { TUKAN_LEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/levage/levageDriveGroups.tukan.config';
import {
  getPouliesDriveGroupsPoints,
  getPouliesOverviewPoints,
  getTukanPouliesOverviewPoints,
} from '../../diagram/poulies/pouliesPoints';
import { TUKAN_TRANSLATION_ZONE_A_MARKERS } from '../../diagram/translation/tukanTranslationZoneAMarkers';
import { TUKAN_TRANSLATION_ZONE_B_MARKERS } from '../../diagram/translation/tukanTranslationZoneBMarkers';
import { TUKAN_TRANSLATION_ZONE_C_MARKERS } from '../../diagram/translation/tukanTranslationZoneCMarkers';
import { TUKAN_TRANSLATION_ZONE_D_MARKERS } from '../../diagram/translation/tukanTranslationZoneDMarkers';
import { getDbNameCandidates } from '../../diagram/diagramPointUtils';
import type { StepId } from '../../../navigation/steps';

export type FleetEntry = {
  point: DiagramPoint;
  label: string;
  tagLabel: string;
  sectionLabel: string;
  stepId: StepId;
  dbCandidates: string[];
};

const ZONE_KEYS: ZoneKey[] = ['nord-a', 'sud-b', 'sud-c', 'nord-d'];
const TUKAN_ZONE_POINTS: Record<ZoneKey, DiagramPoint[]> = {
  'nord-a': TUKAN_TRANSLATION_ZONE_A_MARKERS,
  'sud-b': TUKAN_TRANSLATION_ZONE_B_MARKERS,
  'sud-c': TUKAN_TRANSLATION_ZONE_C_MARKERS,
  'nord-d': TUKAN_TRANSLATION_ZONE_D_MARKERS,
};

const makeLabel = (point: DiagramPoint) => {
  if (point.markerLabel) return point.markerLabel;
  if (point.name) return point.name;
  if (point.tagPrimary) return point.tagPrimary;
  if (point.dbName) return point.dbName;
  return 'Point de graissage';
};

export const buildEntries = (craneId: string, images: CraneImages): FleetEntry[] => {
  const isTukan = craneId === 'tukan';
  const entries: FleetEntry[] = [];

  const addEntry = (point: DiagramPoint, sectionLabel: string, stepId: StepId) => {
    const dbCandidates = getDbNameCandidates(point);
    if (!dbCandidates.length) return;

    entries.push({
      point,
      label: makeLabel(point),
      tagLabel: point.tagPrimary || point.dbName || point.tagSecondary || point.name,
      sectionLabel,
      stepId,
      dbCandidates,
    });
  };

  ZONE_KEYS.forEach(zoneKey => {
    const config = getZoneDiagramConfig(zoneKey, images);
    const points = isTukan ? TUKAN_ZONE_POINTS[zoneKey] : config.points;
    points.forEach(point => {
      addEntry(point, `Translation - ${config.title}`, `translation:${zoneKey}` as StepId);
    });
  });

  const rotationLeft = isTukan ? TUKAN_ROTATION_DRIVE_GROUPS_LEFT_POINTS : ROTATION_DRIVE_GROUPS_LEFT_POINTS;
  rotationLeft.forEach(point => addEntry(point, 'Rotation - Groupe gauche', 'rotation:drive-groups'));

  const rotationRight = isTukan ? TUKAN_ROTATION_DRIVE_GROUPS_RIGHT_POINTS : ROTATION_DRIVE_GROUPS_RIGHT_POINTS;
  rotationRight.forEach(point => addEntry(point, 'Rotation - Groupe droite', 'rotation:drive-groups'));

  const relevage = isTukan ? TUKAN_RELEVAGE_DRIVE_GROUPS_POINTS : RELEVAGE_DRIVE_GROUPS_POINTS;
  relevage.forEach(point => addEntry(point, 'Relevage - Groupes', 'relevage:drive-groups'));

  const levage = isTukan ? TUKAN_LEVAGE_DRIVE_GROUPS_POINTS : LEVAGE_DRIVE_GROUPS_POINTS;
  levage.forEach(point => addEntry(point, 'Levage - Groupes', 'levage:drive-groups'));

  getPouliesDriveGroupsPoints(craneId).forEach(point => addEntry(point, 'Poulies - Groupes', 'poulies:drive-groups'));

  const pouliesOverview = craneId === 'tukan' ? getTukanPouliesOverviewPoints() : getPouliesOverviewPoints(craneId);
  pouliesOverview
    .filter(point => !point.id.includes('nav'))
    .forEach(point => addEntry(point, 'Poulies - Systeme', 'poulies'));

  return entries;
};
```

**Step 2: Update `CriticalPointsPanel.tsx`** — delete the now-moved code and import from the shared module.

- Remove the local imports that are now only used by `buildEntries` (the rotation/relevage/levage/poulies/zone/translation config imports, `getZoneDiagramConfig`, `ZoneKey`, `DiagramPoint` if unused elsewhere in the file, `StepId` if unused).
- Remove the local `CriticalPointEntry` type, `ZONE_KEYS`, `TUKAN_ZONE_POINTS`, `makeLabel`, and `buildEntries`.
- Add at the top:

```typescript
import { buildEntries, type FleetEntry } from '../analytics/fleetEntries';
```

- Replace the local `CriticalPointEntry` references with `FleetEntry`. Update the derived type:

```typescript
type CriticalEntryWithData = FleetEntry & { data: NonNullable<ReturnType<typeof pickLubricationData>> };
```

Keep these imports in `CriticalPointsPanel.tsx` (still used by the component body): `useMemo`, `useNavigate`, `CraneImages`, `useLubricationPointBatch`, `getDbNameCandidates`? (no longer used here — remove), `isCriticalLubricationPoint`, `pickLubricationData`, `stepToPath`, `StepId` (used by `handleNavigate`? it uses `entry.stepId` typed via `FleetEntry`, so `StepId` import can be removed if not otherwise referenced), the CSS import.

**Step 3: Verify**

```bash
npx tsc -b && npm run lint
```

Expected: no type errors, no unused-import lint errors (remove any flagged imports), no eslint issues.

---

### Task 4: Create the fleet aggregation hook

**Files:**
- Create: `frontend/App_Marsa/src/hooks/useFleetLubricationData.ts`
- Modify: `frontend/App_Marsa/src/hooks/useLubricationPointBatch.ts`

**Step 1: Add a `hasLoaded` flag to `useLubricationPointBatch.ts`**

Modify the hook so it reports whether at least one fetch cycle has completed. Change the state/return:

```typescript
import { useCallback, useEffect, useState, useRef } from 'react';
import { fetchLubricationPoint } from '../services/lubricationApi';
import { type LubricationPointDto } from '../types/lubricationPoint';

const POLL_INTERVAL_MS = 5000;

export const useLubricationPointBatch = (names: string[]) => {
  const [lubricationDataMap, setLubricationDataMap] = useState<Map<string, LubricationPointDto>>(new Map());
  const [hasLoaded, setHasLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!names.length) {
      setHasLoaded(true);
      return;
    }

    const newMap = new Map<string, LubricationPointDto>();
    const results = await Promise.allSettled(
      names.map(name => fetchLubricationPoint(name).then(data => ({ name, data }))),
    );

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        newMap.set(result.value.name, result.value.data);
      }
    });

    setLubricationDataMap(newMap);
    setHasLoaded(true);
  }, [names]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = window.setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return { lubricationDataMap, hasLoaded };
};
```

**Step 2: Create `useFleetLubricationData.ts`**

```typescript
import { useMemo } from 'react';
import { cranes } from '../config/cranesConfig';
import { buildEntries } from '../components/dashboard/analytics/fleetEntries';
import {
  pickLubricationData,
  resolveLubricationStatus,
  computeLubricationPercentValue,
  type LubricationStatus,
} from '../components/diagram/diagramPointUtils';
import { useLubricationPointBatch } from './useLubricationPointBatch';

export interface FleetPointRow {
  craneId: string;
  craneName: string;
  pointName: string;
  planned: number | null;
  actual: number | null;
  percent: number | null;
  status: LubricationStatus;
}

interface CraneEntrySet {
  craneId: string;
  craneName: string;
  entries: ReturnType<typeof buildEntries>;
}

export const useFleetLubricationData = () => {
  const craneEntrySets = useMemo<CraneEntrySet[]>(() => {
    return Object.values(cranes)
      .filter(crane => crane.hasData)
      .map(crane => ({
        craneId: crane.id,
        craneName: crane.name,
        entries: buildEntries(crane.id, crane.images),
      }));
  }, []);

  const dbNames = useMemo(() => {
    const names = new Set<string>();
    craneEntrySets.forEach(set =>
      set.entries.forEach(entry => entry.dbCandidates.forEach(name => names.add(name))),
    );
    return [...names];
  }, [craneEntrySets]);

  const { lubricationDataMap, hasLoaded } = useLubricationPointBatch(dbNames);

  const rows = useMemo<FleetPointRow[]>(() => {
    const list: FleetPointRow[] = [];
    const seen = new Set<string>();

    craneEntrySets.forEach(set => {
      set.entries.forEach(entry => {
        const data = pickLubricationData(lubricationDataMap, entry.dbCandidates);
        if (!data) return;
        const key = `${set.craneId}::${data.name}`;
        if (seen.has(key)) return;
        seen.add(key);

        list.push({
          craneId: set.craneId,
          craneName: set.craneName,
          pointName: data.name,
          planned: data.plannedAmount,
          actual: data.actualAmount,
          percent: computeLubricationPercentValue(data.actualAmount, data.plannedAmount),
          status: resolveLubricationStatus(data.actualAmount, data.plannedAmount),
        });
      });
    });

    return list;
  }, [craneEntrySets, lubricationDataMap]);

  return { rows, hasLoaded };
};
```

**Step 3: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 5: Create the chart theme module (registration + palette + base options)

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/chartTheme.ts`

**Step 1: Implement**

```typescript
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartType,
} from 'chart.js';
import { useTheme } from '../../../theme/ThemeProvider';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface ChartPalette {
  text: string;
  textSecondary: string;
  grid: string;
  surface: string;
  border: string;
}

const cssVar = (name: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
};

const readChartPalette = (): ChartPalette => ({
  text: cssVar('--text-primary', '#d9e2ef'),
  textSecondary: cssVar('--text-secondary', '#93a3b8'),
  grid: cssVar('--canvas-stripe', 'rgba(148, 163, 184, 0.06)'),
  surface: cssVar('--surface-elevated', '#0e1624'),
  border: cssVar('--border-color', '#1f2b3b'),
});

// Recompute after paint so the body theme class is already applied.
export const useChartPalette = (): ChartPalette => {
  const { theme } = useTheme();
  const [palette, setPalette] = useState<ChartPalette>(readChartPalette);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPalette(readChartPalette()));
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return palette;
};

export const baseChartOptions = <T extends ChartType>(palette: ChartPalette): ChartOptions<T> =>
  ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: palette.textSecondary, font: { family: 'Manrope', size: 12 } },
      },
      tooltip: {
        backgroundColor: palette.surface,
        borderColor: palette.border,
        borderWidth: 1,
        titleColor: palette.text,
        bodyColor: palette.textSecondary,
        titleFont: { family: 'Manrope' },
        bodyFont: { family: 'Manrope' },
      },
    },
  }) as ChartOptions<T>;
```

**Step 2: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 6: Create `ChartCard` wrapper + styles

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/ChartCard.tsx`
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/ChartCard.css`

**Step 1: `ChartCard.tsx`**

```tsx
import { type ReactNode } from 'react';
import './ChartCard.css';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  children: ReactNode;
}

const ChartCard = ({ title, subtitle, isLoading, isEmpty, children }: ChartCardProps) => {
  return (
    <section className="chart-card">
      <header className="chart-card__header">
        <h3 className="chart-card__title">{title}</h3>
        {subtitle ? <p className="chart-card__subtitle">{subtitle}</p> : null}
      </header>
      <div className="chart-card__body">
        {isLoading ? (
          <div className="chart-card__skeleton" aria-hidden />
        ) : isEmpty ? (
          <p className="chart-card__empty">Aucune donnée</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export default ChartCard;
```

**Step 2: `ChartCard.css`**

```css
.chart-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 260px;
}

.chart-card__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-card__subtitle {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.chart-card__body {
  position: relative;
  flex: 1;
  min-height: 200px;
}

.chart-card__canvas-wrap {
  position: relative;
  height: 200px;
}

.chart-card__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.chart-card__center-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.chart-card__center-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.chart-card__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.chart-card__skeleton {
  height: 200px;
  border-radius: 10px;
  background: linear-gradient(90deg, var(--interactive-bg), var(--interactive-bg-strong), var(--interactive-bg));
  background-size: 200% 100%;
  animation: chart-card-shimmer 1.4s ease-in-out infinite;
}

@keyframes chart-card-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Step 3: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 7: Create `StatusDonut`

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/StatusDonut.tsx`

**Step 1: Implement**

```tsx
import { Doughnut } from 'react-chartjs-2';
import { STATUS_RGB } from '../../diagram/diagramPointUtils';
import { baseChartOptions, useChartPalette } from './chartTheme';

interface StatusDonutProps {
  green: number;
  orange: number;
  red: number;
}

const StatusDonut = ({ green, orange, red }: StatusDonutProps) => {
  const palette = useChartPalette();
  const total = green + orange + red;

  const data = {
    labels: ['Vert', 'Orange', 'Rouge'],
    datasets: [
      {
        data: [green, orange, red],
        backgroundColor: [
          `rgb(${STATUS_RGB.green})`,
          `rgb(${STATUS_RGB.orange})`,
          `rgb(${STATUS_RGB.red})`,
        ],
        borderColor: palette.surface,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...baseChartOptions<'doughnut'>(palette),
    cutout: '68%',
  };

  return (
    <div className="chart-card__canvas-wrap">
      <Doughnut data={data} options={options} />
      <div className="chart-card__center">
        <span className="chart-card__center-value">{total}</span>
        <span className="chart-card__center-label">points</span>
      </div>
    </div>
  );
};

export default StatusDonut;
```

**Step 2: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 8: Create `CriticalByCraneBar`

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/CriticalByCraneBar.tsx`

**Step 1: Implement**

```tsx
import { Bar } from 'react-chartjs-2';
import { STATUS_RGB } from '../../diagram/diagramPointUtils';
import { baseChartOptions, useChartPalette } from './chartTheme';

interface CriticalByCraneBarProps {
  data: { craneName: string; redCount: number }[];
}

const CriticalByCraneBar = ({ data }: CriticalByCraneBarProps) => {
  const palette = useChartPalette();

  const chartData = {
    labels: data.map(d => d.craneName),
    datasets: [
      {
        label: 'Points critiques',
        data: data.map(d => d.redCount),
        backgroundColor: `rgb(${STATUS_RGB.red})`,
        borderRadius: 6,
        maxBarThickness: 56,
      },
    ],
  };

  const base = baseChartOptions<'bar'>(palette);
  const options = {
    ...base,
    plugins: { ...base.plugins, legend: { display: false } },
    scales: {
      x: { ticks: { color: palette.textSecondary }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { color: palette.textSecondary, precision: 0 },
        grid: { color: palette.grid },
      },
    },
  };

  return (
    <div className="chart-card__canvas-wrap">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default CriticalByCraneBar;
```

**Step 2: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 9: Create `PlannedVsActualBar`

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/PlannedVsActualBar.tsx`

**Step 1: Implement**

```tsx
import { Bar } from 'react-chartjs-2';
import { baseChartOptions, useChartPalette } from './chartTheme';

interface PlannedVsActualBarProps {
  data: { craneName: string; planned: number; actual: number }[];
}

const PlannedVsActualBar = ({ data }: PlannedVsActualBarProps) => {
  const palette = useChartPalette();

  const chartData = {
    labels: data.map(d => d.craneName),
    datasets: [
      {
        label: 'Planifié',
        data: data.map(d => d.planned),
        backgroundColor: 'rgb(17, 131, 136)',
        borderRadius: 6,
        maxBarThickness: 40,
      },
      {
        label: 'Réel',
        data: data.map(d => d.actual),
        backgroundColor: 'rgb(37, 99, 235)',
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  const base = baseChartOptions<'bar'>(palette);
  const options = {
    ...base,
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins?.tooltip,
        callbacks: {
          afterBody: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            const row = data[idx];
            if (!row) return '';
            const deficit = Math.round((row.planned - row.actual) * 100) / 100;
            return `Déficit: ${deficit}`;
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: palette.textSecondary }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { color: palette.textSecondary },
        grid: { color: palette.grid },
      },
    },
  };

  return (
    <div className="chart-card__canvas-wrap">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default PlannedVsActualBar;
```

**Step 2: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 10: Create `AvgPercentGauge`

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/AvgPercentGauge.tsx`

**Step 1: Implement**

```tsx
import { Doughnut } from 'react-chartjs-2';
import { STATUS_RGB } from '../../diagram/diagramPointUtils';
import { baseChartOptions, useChartPalette } from './chartTheme';

interface AvgPercentGaugeProps {
  label: string;
  percent: number;
}

const arcColor = (percent: number): string => {
  if (percent >= 90) return `rgb(${STATUS_RGB.green})`;
  if (percent >= 50) return `rgb(${STATUS_RGB.orange})`;
  return `rgb(${STATUS_RGB.red})`;
};

const AvgPercentGauge = ({ label, percent }: AvgPercentGaugeProps) => {
  const palette = useChartPalette();
  const clamped = Math.max(0, Math.min(100, percent));

  const data = {
    labels: ['Graissé', 'Restant'],
    datasets: [
      {
        data: [clamped, 100 - clamped],
        backgroundColor: [arcColor(clamped), palette.border],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const base = baseChartOptions<'doughnut'>(palette);
  const options = {
    ...base,
    cutout: '72%',
    plugins: { ...base.plugins, legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className="chart-card__canvas-wrap">
      <Doughnut data={data} options={options} />
      <div className="chart-card__center">
        <span className="chart-card__center-value">{Math.round(clamped)}%</span>
        <span className="chart-card__center-label">{label}</span>
      </div>
    </div>
  );
};

export default AvgPercentGauge;
```

**Step 2: Verify**

```bash
npx tsc -b
```

Expected: no type errors.

---

### Task 11: Create `FleetOverviewPanel` + styles (shapes data, lays out charts)

**Files:**
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/FleetOverviewPanel.tsx`
- Create: `frontend/App_Marsa/src/components/dashboard/analytics/FleetOverviewPanel.css`

**Step 1: `FleetOverviewPanel.tsx`**

```tsx
import { useMemo } from 'react';
import { useFleetLubricationData } from '../../../hooks/useFleetLubricationData';
import ChartCard from './ChartCard';
import StatusDonut from './StatusDonut';
import CriticalByCraneBar from './CriticalByCraneBar';
import PlannedVsActualBar from './PlannedVsActualBar';
import AvgPercentGauge from './AvgPercentGauge';
import './FleetOverviewPanel.css';

const FleetOverviewPanel = () => {
  const { rows, hasLoaded } = useFleetLubricationData();

  const stats = useMemo(() => {
    const statusCounts = { green: 0, orange: 0, red: 0 };
    const perCrane = new Map<
      string,
      { craneName: string; redCount: number; planned: number; actual: number; pctSum: number; pctCount: number }
    >();

    rows.forEach(row => {
      statusCounts[row.status] += 1;

      const bucket =
        perCrane.get(row.craneId) ??
        { craneName: row.craneName, redCount: 0, planned: 0, actual: 0, pctSum: 0, pctCount: 0 };

      if (row.status === 'red') bucket.redCount += 1;
      if (row.planned !== null) bucket.planned += row.planned;
      if (row.actual !== null) bucket.actual += row.actual;
      if (row.percent !== null) {
        bucket.pctSum += row.percent;
        bucket.pctCount += 1;
      }
      perCrane.set(row.craneId, bucket);
    });

    const craneList = [...perCrane.values()];

    return {
      statusCounts,
      criticalByCrane: craneList.map(c => ({ craneName: c.craneName, redCount: c.redCount })),
      plannedVsActual: craneList.map(c => ({
        craneName: c.craneName,
        planned: Math.round(c.planned * 100) / 100,
        actual: Math.round(c.actual * 100) / 100,
      })),
      gauges: craneList.map(c => ({
        craneName: c.craneName,
        percent: c.pctCount ? c.pctSum / c.pctCount : 0,
      })),
    };
  }, [rows]);

  const isLoading = !hasLoaded && rows.length === 0;
  const isEmpty = hasLoaded && rows.length === 0;
  const totalStatus = stats.statusCounts.green + stats.statusCounts.orange + stats.statusCounts.red;

  return (
    <section className="fleet-overview" aria-label="Vue d'ensemble de la flotte">
      <header className="fleet-overview__header">
        <p className="fleet-overview__eyebrow">Vue d'ensemble</p>
        <h2 className="fleet-overview__title">État de graissage de la flotte</h2>
      </header>

      <div className="fleet-overview__grid">
        <ChartCard
          title="Répartition des états"
          subtitle={`${stats.statusCounts.green} vert · ${stats.statusCounts.orange} orange · ${stats.statusCounts.red} rouge`}
          isLoading={isLoading}
          isEmpty={isEmpty || totalStatus === 0}
        >
          <StatusDonut
            green={stats.statusCounts.green}
            orange={stats.statusCounts.orange}
            red={stats.statusCounts.red}
          />
        </ChartCard>

        <ChartCard
          title="Points critiques par grue"
          isLoading={isLoading}
          isEmpty={isEmpty || stats.criticalByCrane.length === 0}
        >
          <CriticalByCraneBar data={stats.criticalByCrane} />
        </ChartCard>

        <ChartCard
          title="Planifié vs Réel"
          isLoading={isLoading}
          isEmpty={isEmpty || stats.plannedVsActual.length === 0}
        >
          <PlannedVsActualBar data={stats.plannedVsActual} />
        </ChartCard>

        <ChartCard
          title="Taux de graissage moyen"
          isLoading={isLoading}
          isEmpty={isEmpty || stats.gauges.length === 0}
        >
          <div className="fleet-overview__gauges">
            {stats.gauges.map(g => (
              <AvgPercentGauge key={g.craneName} label={g.craneName} percent={g.percent} />
            ))}
          </div>
        </ChartCard>
      </div>
    </section>
  );
};

export default FleetOverviewPanel;
```

**Step 2: `FleetOverviewPanel.css`**

```css
.fleet-overview {
  margin-bottom: 28px;
}

.fleet-overview__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.fleet-overview__title {
  margin: 4px 0 16px;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}

.fleet-overview__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.fleet-overview__gauges {
  display: flex;
  gap: 12px;
  height: 100%;
}

.fleet-overview__gauges > * {
  flex: 1;
}
```

**Step 3: Verify**

```bash
npx tsc -b && npm run lint
```

Expected: no type errors, no lint issues.

---

### Task 12: Render the panel on the landing dashboard

**Files:**
- Modify: `frontend/App_Marsa/src/components/dashboard/GrueDashboard/GrueDashboard.tsx`

**Step 1: Add the import** (top of file):

```typescript
import FleetOverviewPanel from '../analytics/FleetOverviewPanel';
```

**Step 2: Render it** just inside the `<section className="grue-dashboard">`, immediately after the closing `</header>` and before `<div className="grue-dashboard__sections">`:

```tsx
      <FleetOverviewPanel />

      <div className="grue-dashboard__sections">
```

**Step 3: Verify**

```bash
npx tsc -b && npm run lint
```

Expected: no type errors, no lint issues.

---

### Task 13: Full build + manual verification

**Step 1: Build & lint**

```bash
cd "D:/Lubricayion V2/Lubrification_AppV2/frontend/App_Marsa"
npm run build
npm run lint
```

Expected: `tsc -b` + vite build succeed with no errors; lint clean.

**Step 2: Manual check**

```bash
npm run dev
```

Then in the browser at the landing page (`/`):
- The "État de graissage de la flotte" section shows above the crane cards with four chart cards.
- Status donut shows green/orange/red counts with a center total; critical-by-crane bar shows red counts; planned-vs-actual grouped bars render; two gauges show avg %.
- Toggle light/dark (header toggle) → charts re-theme (tick/grid/tooltip colors follow).
- Navigate into a crane (Ardelt/Tukan) → the existing Critical Points panel still renders identically.
- Stop the backend → reload landing → charts show "Aucune donnée" empty states, and the crane selection cards still work.

**Step 3: Commit**

Only if the user asks. Suggested message: `feat(frontend): add fleet overview charts to landing dashboard`.

---

## Notes / Deviations from design

- Added an additive `hasLoaded` flag to `useLubricationPointBatch` (Task 4) to cleanly distinguish loading from empty — existing callers (`CriticalPointsPanel`) are unaffected since they ignore the new field.
- Center labels for donut/gauge are rendered as absolutely-positioned DOM overlays (via `ChartCard.css`) rather than a custom Chart.js plugin — simpler and theme-aware.
