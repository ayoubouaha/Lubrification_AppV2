import { useFleetLubricationData } from '../../../hooks/useFleetLubricationData';
import FleetKpiCards from './FleetKpiCards';
import ZoneDetailTables from './ZoneDetailTables';
import './FleetOverviewPanel.css';

const FleetOverviewPanel = () => {
  const { rows, hasLoaded } = useFleetLubricationData();

  const isLoading = !hasLoaded && rows.length === 0;

  return (
    <section className="fleet-overview" aria-label="Vue d'ensemble de la flotte">
      <header className="fleet-overview__header">
        <p className="fleet-overview__eyebrow">Vue d'ensemble</p>
        <h2 className="fleet-overview__title">État de graissage de la flotte</h2>
      </header>

      <FleetKpiCards rows={rows} isLoading={isLoading} />

      <ZoneDetailTables rows={rows} isLoading={isLoading} />
    </section>
  );
};

export default FleetOverviewPanel;
