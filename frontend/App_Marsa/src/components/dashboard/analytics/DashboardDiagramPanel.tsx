import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cranes, type CraneConfig } from '../../../config/cranesConfig';
import InteractiveDiagram from '../../diagram/InteractiveDiagram/InteractiveDiagram';
import type { DiagramPoint } from '../../diagram/types';
import type { LubricationPointDto } from '../../../types/lubricationPoint';
import { getDbNameCandidates, resolveLubricationStatus } from '../../diagram/diagramPointUtils';
import { CRANE_SYSTEMS, getSystemById } from './craneSystemDiagrams';
import PointDetailCard, { type ViewStats } from './PointDetailCard';
import './DashboardDiagramPanel.css';

export interface DiagramSelection {
  craneId: string;
  systemId: string;
  pointId: string;
  /** Changes on every locate request so repeated clicks re-trigger the effect. */
  nonce: number;
}

interface DashboardDiagramPanelProps {
  selection?: DiagramSelection | null;
}

const DashboardDiagramPanel = ({ selection }: DashboardDiagramPanelProps) => {
  const availableCranes = useMemo<CraneConfig[]>(
    () => Object.values(cranes).filter(crane => crane.hasData),
    [],
  );

  const [craneId, setCraneId] = useState<string>(availableCranes[0]?.id ?? '');
  const [systemId, setSystemId] = useState<string>(CRANE_SYSTEMS[0].id);
  const [hoveredPoint, setHoveredPoint] = useState<DiagramPoint | null>(null);
  const [focusPointId, setFocusPointId] = useState<string>('');
  const [dataMap, setDataMap] = useState<Map<string, LubricationPointDto>>(new Map());
  const sectionRef = useRef<HTMLElement | null>(null);

  const crane = useMemo(
    () => availableCranes.find(item => item.id === craneId) ?? availableCranes[0],
    [availableCranes, craneId],
  );

  const system = getSystemById(systemId);
  const views = useMemo(() => (crane ? system.getViews(crane) : []), [crane, system]);

  // Once the targeted system is rendered, surface the focused point in the side card.
  useEffect(() => {
    if (!focusPointId) return;
    for (const view of views) {
      const target = view.points.find(point => point.id === focusPointId);
      if (target) {
        setHoveredPoint(target);
        break;
      }
    }
  }, [focusPointId, views]);

  useEffect(() => {
    setHoveredPoint(null);
  }, [systemId, craneId]);

  // Apply an external "locate on schema" request coming from the anomalies panel.
  useEffect(() => {
    if (!selection) return;
    setCraneId(selection.craneId);
    setSystemId(selection.systemId);
    setFocusPointId(selection.pointId);
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.nonce]);

  const mergeData = useCallback((incoming: Map<string, LubricationPointDto>) => {
    setDataMap(previous => {
      const next = new Map(previous);
      incoming.forEach((value, key) => next.set(key, value));
      return next;
    });
  }, []);

  const stats = useMemo<ViewStats>(() => {
    const result: ViewStats = { total: 0, conforme: 0, sousDose: 0, surDose: 0 };
    const seen = new Set<string>();
    views.forEach(view => {
      view.points.forEach(point => {
        getDbNameCandidates(point).forEach(candidate => {
          const data = dataMap.get(candidate);
          if (!data || seen.has(data.name)) return;
          seen.add(data.name);
          result.total += 1;
          const { actualAmount: actual, plannedAmount: planned } = data;
          if (actual !== null && planned !== null && planned > 0 && actual > planned) {
            result.surDose += 1;
          } else if (resolveLubricationStatus(actual, planned) === 'green') {
            result.conforme += 1;
          } else {
            result.sousDose += 1;
          }
        });
      });
    });
    return result;
  }, [views, dataMap]);

  const subtitle = crane ? `${crane.name} · ${system.label}` : system.label;

  if (!crane) {
    return null;
  }

  return (
    <section className="diagram-panel" aria-label="Cartographie interactive" ref={sectionRef}>
      <header className="diagram-panel__header">
        <p className="diagram-panel__eyebrow">Cartographie interactive</p>
        <h2 className="diagram-panel__title">Points de graissage sur schéma technique</h2>
      </header>

      <div className="diagram-panel__cranes" role="tablist" aria-label="Sélection de la grue">
        {availableCranes.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === crane.id}
            className={`diagram-panel__crane-tab${item.id === crane.id ? ' diagram-panel__crane-tab--active' : ''}`}
            onClick={() => {
              setFocusPointId('');
              setCraneId(item.id);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="diagram-panel__systems" role="tablist" aria-label="Sélection du système">
        {CRANE_SYSTEMS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === system.id}
            className={`diagram-panel__system-tab${item.id === system.id ? ' diagram-panel__system-tab--active' : ''}`}
            onClick={() => {
              setFocusPointId('');
              setSystemId(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="diagram-panel__layout">
        <div className={`diagram-panel__stage${views.length > 1 ? ' diagram-panel__stage--split' : ''}`}>
          {views.map((view, index) => (
            <div className="diagram-panel__view" key={`${system.id}-${index}`}>
              <InteractiveDiagram
                title={view.title}
                subtitle={view.subtitle}
                imageSrc={view.imageSrc}
                imageAlt={view.imageAlt}
                points={view.points}
                size={view.size}
                showHeader={views.length > 1}
                initialActivePointId={focusPointId}
                disablePopup
                onPointHover={setHoveredPoint}
                onLubricationData={mergeData}
                onPointClick={point => {
                  const target = system.resolveLink?.(crane, point);
                  if (target) setSystemId(target);
                }}
              />
            </div>
          ))}
        </div>

        <PointDetailCard point={hoveredPoint} dataMap={dataMap} subtitle={subtitle} stats={stats} />
      </div>
    </section>
  );
};

export default DashboardDiagramPanel;
