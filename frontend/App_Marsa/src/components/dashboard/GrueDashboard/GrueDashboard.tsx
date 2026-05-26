import FleetOverviewPanel from '../analytics/FleetOverviewPanel';
import './GrueDashboard.css';

interface GrueDashboardProps {
  onSelectCrane: (craneId: string) => void;
}
const GrueDashboard = ({ onSelectCrane }: GrueDashboardProps) => {
  void onSelectCrane;

  return (
    <section className="grue-dashboard" aria-label="Grue dashboard">
      <header className="grue-dashboard__header">
        <p className="grue-dashboard__eyebrow">Tableau de bord maintenance</p>
        <h1 className="grue-dashboard__title">Gestion de graissage des grues</h1>
        <p className="grue-dashboard__subtitle">
          Accédez aux systèmes de graissage et aux schémas interactifs pour guider les interventions.
        </p>
      </header>

      <FleetOverviewPanel />
    </section>
  );
};

export default GrueDashboard;
