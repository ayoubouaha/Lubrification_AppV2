import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cranes, type CraneConfig } from '../../../config/cranesConfig';
import InteractiveDiagram from '../../diagram/InteractiveDiagram/InteractiveDiagram';
import type { DiagramPoint } from '../../diagram/types';
import type { LubricationPointDto } from '../../../types/lubricationPoint';
import {
  getDbNameCandidates,
  resolveLubricationGrade,
  expandSinglePointMarkers,
} from '../../diagram/diagramPointUtils';
import { CRANE_SYSTEMS, getSystemById } from './craneSystemDiagrams';
import PointDetailCard, { type ViewStats } from './PointDetailCard';
import DosageLegend from './DosageLegend';
import { usePointHistory } from '../../../hooks/usePointHistory';
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
  /**
   * Date-filtered lubrication data for the selected execution date (+ graisseur). Drives the
   * marker colours, the side detail card and the view stats so the schema reflects the selected
   * date instead of latest-state.
   */
  dataMap: Map<string, LubricationPointDto>;
}

const DashboardDiagramPanel = ({ selection, dataMap }: DashboardDiagramPanelProps) => {
  const availableCranes = useMemo<CraneConfig[]>(
    () => Object.values(cranes).filter(crane => crane.hasData),
    [],
  );

  const [craneId, setCraneId] = useState<string>(availableCranes[0]?.id ?? '');
  const [systemId, setSystemId] = useState<string>(CRANE_SYSTEMS[0].id);
  const [hoveredPoint, setHoveredPoint] = useState<DiagramPoint | null>(null);
  // The last clicked point stays in the card; hovering only previews on top of it.
  const [pinnedPoint, setPinnedPoint] = useState<DiagramPoint | null>(null);
  const [focusPointId, setFocusPointId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const pointHistory = usePointHistory();

  const crane = useMemo(
    () => availableCranes.find(item => item.id === craneId) ?? availableCranes[0],
    [availableCranes, craneId],
  );

  const system = getSystemById(systemId);
  const views = useMemo(
    () =>
      (crane ? system.getViews(crane) : []).map(view => ({
        ...view,
        points: expandSinglePointMarkers(view.points),
      })),
    [crane, system],
  );

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

  // Fullscreen overlay: close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  useEffect(() => {
    // Switching crane/system clears the card: the pinned point isn't in the new view.
    setHoveredPoint(null);
    setPinnedPoint(null);
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
          const grade = resolveLubricationGrade(data.actualAmount, data.plannedAmount);
          if (grade === 'surdose') {
            result.surDose += 1;
          } else if (grade === 'conforme') {
            result.conforme += 1;
          } else {
            // sous-dosé + critique
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

  const panel = (
    <section
      className={`diagram-panel${isExpanded ? ' diagram-panel--expanded' : ''}`}
      aria-label="Cartographie interactive"
      ref={sectionRef}
    >
      <header className="diagram-panel__header">
        <p className="diagram-panel__eyebrow">Cartographie interactive</p>
        <button
          type="button"
          className="diagram-panel__expand"
          onClick={() => setIsExpanded(value => !value)}
          aria-label={isExpanded ? 'Réduire la cartographie' : 'Agrandir la cartographie'}
          title={isExpanded ? 'Réduire' : 'Agrandir'}
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
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
                dataMapOverride={dataMap}
                onPointClick={point => setPinnedPoint(point)}
              />
            </div>
          ))}
        </div>

        <div className="diagram-panel__aside">
          <DosageLegend />
          <PointDetailCard
            point={hoveredPoint ?? pinnedPoint}
            dataMap={dataMap}
            subtitle={subtitle}
            stats={stats}
            history={pointHistory}
          />
        </div>
      </div>
    </section>
  );

  // When expanded, render into <body> so the fixed overlay escapes any transformed ancestor
  // (the dashboard's reveal animations create a containing block that would otherwise trap it).
  return isExpanded ? createPortal(panel, document.body) : panel;
};

export default DashboardDiagramPanel;
