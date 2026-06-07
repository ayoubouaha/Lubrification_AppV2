import FleetOverviewPanel from '../analytics/FleetOverviewPanel';
import './GrueDashboard.css';

const GrueDashboard = () => {
  return (
    <section className="grue-dashboard" aria-label="Grue dashboard">
      <header className="grue-dashboard__header">
        <p className="grue-dashboard__eyebrow">Tableau de bord maintenance</p>
        <h1 className="grue-dashboard__title">Gestion de graissage des grues</h1>
      </header>

      <FleetOverviewPanel />
    </section>
  );
};

export default GrueDashboard;
