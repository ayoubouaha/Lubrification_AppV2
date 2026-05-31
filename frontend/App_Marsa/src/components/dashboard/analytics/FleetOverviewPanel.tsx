import { useCallback, useState } from 'react';
import { useFleetLubricationData, type FleetPointRow } from '../../../hooks/useFleetLubricationData';
import FleetKpiCards from './FleetKpiCards';
import ZoneDetailTables from './ZoneDetailTables';
import AnomaliesPanel from './AnomaliesPanel';
import DashboardDiagramPanel, { type DiagramSelection } from './DashboardDiagramPanel';
import { stepIdToSystemId } from './craneSystemDiagrams';
import './FleetOverviewPanel.css';

const FleetOverviewPanel = () => {
  const { rows, hasLoaded } = useFleetLubricationData();

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
      </header>

      <FleetKpiCards rows={rows} isLoading={isLoading} />

      <ZoneDetailTables rows={rows} isLoading={isLoading} />

      <AnomaliesPanel rows={rows} isLoading={isLoading} onLocate={handleLocate} />

      <DashboardDiagramPanel selection={selection} />
    </section>
  );
};

export default FleetOverviewPanel;
