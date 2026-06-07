import { useCallback, useState } from 'react';
import { useFleetLubricationData, type FleetPointRow } from '../../../hooks/useFleetLubricationData';
import { useExecutionDates } from '../../../hooks/useExecutionDates';
import { useConformityTrend } from '../../../hooks/useConformityTrend';
import FleetKpiCards from './FleetKpiCards';
import ConformityTrendChart from './ConformityTrendChart';
import AnalysisChartsPanel from './AnalysisChartsPanel';
import DosageDonut from './DosageDonut';
import ZoneDetailTables from './ZoneDetailTables';
import AnomaliesPanel from './AnomaliesPanel';
import DashboardDiagramPanel, { type DiagramSelection } from './DashboardDiagramPanel';
import ExecutionDateSelector from './ExecutionDateSelector';
import SyncFreshnessBadge from './SyncFreshnessBadge';
import { stepIdToSystemId } from './craneSystemDiagrams';
import './FleetOverviewPanel.css';

const FleetOverviewPanel = () => {
  const {
    dates,
    selectedDate,
    setSelectedDate,
    selectedGraisseur,
    setSelectedGraisseur,
    hasLoaded: datesLoaded,
  } = useExecutionDates();
  const { rows, hasLoaded, lubricationDataMap } = useFleetLubricationData(
    selectedDate,
    selectedGraisseur,
  );
  const { points: trendPoints, isLoading: trendLoading } = useConformityTrend(dates);

  const isLoading = !hasLoaded && rows.length === 0;

  const [selection, setSelection] = useState<DiagramSelection | null>(null);

  const handleLocate = useCallback((row: FleetPointRow) => {
    setSelection({
      craneId: row.craneId,
      systemId: stepIdToSystemId(row.stepId),
      pointId: row.pointId,
      nonce: Date.now(),
    });
  }, []);

  return (
    <section className="fleet-overview" aria-label="Vue d'ensemble de la flotte">
      <header className="fleet-overview__header">
        <p className="fleet-overview__eyebrow">Vue d'ensemble</p>
        <h2 className="fleet-overview__title">État de graissage de la flotte</h2>
        <div className="fleet-overview__controls">
          <ExecutionDateSelector
            dates={dates}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedGraisseur={selectedGraisseur}
            onGraisseurChange={setSelectedGraisseur}
            isLoading={!datesLoaded}
          />
          <SyncFreshnessBadge />
        </div>
      </header>

      <FleetKpiCards rows={rows} isLoading={isLoading} />

      <ZoneDetailTables rows={rows} isLoading={isLoading} />

      <AnalysisChartsPanel rows={rows} isLoading={isLoading} />

      <AnomaliesPanel rows={rows} isLoading={isLoading} onLocate={handleLocate} />

      <DashboardDiagramPanel selection={selection} dataMap={lubricationDataMap} />

      <div className="fleet-overview__charts-row">
        <ConformityTrendChart points={trendPoints} isLoading={trendLoading} />
        <DosageDonut rows={rows} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default FleetOverviewPanel;
