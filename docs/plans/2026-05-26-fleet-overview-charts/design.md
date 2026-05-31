# Fleet Overview Charts — Design

**Date:** 2026-05-26
**App:** `frontend/App_Marsa` (React 19 + Vite + TypeScript)
**Status:** Validated, ready for implementation plan

## Goal

Add a current-state, all-cranes analytics section (four Chart.js charts) to the landing dashboard, reusing existing data, status rules, and theming. Frontend-only; no backend changes.

## Scope (YAGNI)

In scope:
- Four current-state charts on the landing dashboard: Status donut, Critical-by-crane bar, Planned-vs-actual bar, Avg % graissage gauge.
- A reusable fleet-wide aggregation hook over the existing `/api/lubrication/latest/{name}` API.

Explicitly out of scope this round: backend history endpoint, time-series/trends, multi-week comparison, RBM recommendations, user roles, theme restyle to gold/cyan.

## Theming decision

Reuse the app's existing dark/light CSS variables (`--page-bg #070d16`, `--surface-*`, `--border-color`, `--text-*`) and the existing status colors (green `34,197,94`, orange `245,158,11`, red `239,68,68`). Do **not** impose the original brief's `#0e1014`/gold/cyan — keeps visual consistency and the light/dark toggle working.

## Section 1 — Data aggregation architecture

Charts need current-state data for all points across cranes with `hasData: true` (`ardelt`, `tukan`). Today that aggregation only exists per-crane inside `CriticalPointsPanel.buildEntries()`.

- Extract `buildEntries` into a crane-agnostic shared module (`fleetEntries.ts`).
- New hook `useFleetLubricationData()`: for each crane with data, build its DB-name candidates (via the extracted logic + existing `getDbNameCandidates`), dedupe names across cranes, fetch via the existing `useLubricationPointBatch` (same 5s polling, same API).
- Returns normalized rows: `{ craneId, pointName, planned, actual, percent, status }`, computed with the **same** `resolveMarkerColor` / `isCriticalLubricationPoint` rules from `diagramPointUtils.ts` so charts and markers never disagree.

One source of truth for point status; no duplicated thresholds; no backend work.

## Section 2 — Component structure

Under `src/components/dashboard/analytics/`:

- `FleetOverviewPanel.tsx` — container; calls the hook, derives the four datasets with `useMemo`, lays out a responsive grid; rendered inside `GrueDashboard` above the selection cards.
- `ChartCard.tsx` — presentational titled card (existing surface vars) with loading skeleton + empty state.
- Four dumb chart components (props in, no fetching): `StatusDonut`, `CriticalByCraneBar`, `PlannedVsActualBar`, `AvgPercentGauge`.
- `chartTheme.ts` — shared Chart.js options derived from CSS variables + status colors; re-derived on light/dark toggle.

Library: `chart.js` + `react-chartjs-2`.

Separation: aggregation (hook) → shaping (panel memo selectors) → rendering (dumb charts) → styling (`chartTheme` + `ChartCard`).

## Section 3 — Chart specs

1. **StatusDonut** — counts by status; segments green/orange/red; center total; legend with counts.
2. **CriticalByCraneBar** — vertical bar per crane = count of `status==='red'`; red bars; labels from `cranes[id].name`.
3. **PlannedVsActualBar** — grouped bars per crane: summed `planned` vs `actual` (nulls skipped); planned teal `rgb(17,131,136)`, actual blue `rgb(37,99,235)`; tooltip shows deficit.
4. **AvgPercentGauge** — half-doughnut per crane = mean % graissage (nulls excluded); arc thresholds mirror markers (≥90 green, 50–90 orange, <50 red).

`chartTheme.ts`: reads CSS vars via `getComputedStyle(document.body)`; font `Manrope`; grid `--canvas-stripe`; ticks `--text-secondary`; tooltip bg `--surface-elevated`. Status color constants exported from `diagramPointUtils` and shared.

Edge cases: crane with zero fetched points → empty state, never `NaN`; all-zero donut → "Aucune donnée".

## Section 4 — Files, states, verification

New deps: `chart.js`, `react-chartjs-2`.

Create:
- `src/hooks/useFleetLubricationData.ts`
- `src/components/dashboard/analytics/fleetEntries.ts`
- `src/components/dashboard/analytics/FleetOverviewPanel.tsx` + `.css`
- `src/components/dashboard/analytics/ChartCard.tsx` + `.css`
- `src/components/dashboard/analytics/StatusDonut.tsx`
- `src/components/dashboard/analytics/CriticalByCraneBar.tsx`
- `src/components/dashboard/analytics/PlannedVsActualBar.tsx`
- `src/components/dashboard/analytics/AvgPercentGauge.tsx`
- `src/components/dashboard/analytics/chartTheme.ts`

Modify:
- `CriticalPointsPanel.tsx` — import `buildEntries` from `fleetEntries.ts` (behavior unchanged).
- `diagramPointUtils.ts` — export shared status-color constants.
- `GrueDashboard.tsx` — render `<FleetOverviewPanel />` above selection cards.

States: loading → skeleton; per-crane missing → empty series; all cranes empty (API down) → info row, selection cards still work.

Verification (in `frontend/App_Marsa`): `npm run build` (tsc + vite, no type errors), `npm run lint` (clean), `npm run dev` (charts render with live data, re-theme on toggle, Critical Points panel unchanged).
