import DiagramTooltip from "../DiagramTooltip/DiagramTooltip";
import { type DiagramPoint } from "../types";
import { type LubricationPointDto } from "../../../types/lubricationPoint";
import { useMemo, type CSSProperties } from "react";
import { getDbNameCandidates, pickLubricationData, resolveLubricationGrade, GRADE_RGB } from "../diagramPointUtils";
import "./DiagramMarker.css";

interface DiagramMarkerProps {
  point: DiagramPoint;
  isActive: boolean;
  onClick: (point: DiagramPoint) => void;
  onHover?: (point: DiagramPoint | null) => void;
  lubricationDataMap?: Map<string, LubricationPointDto>;
}

const DiagramMarker = ({ point, isActive, onClick, onHover, lubricationDataMap }: DiagramMarkerProps) => {
  const defaultColor = point.markerColor ?? "34, 197, 94";
  const dbNameCandidates = useMemo(() => getDbNameCandidates(point), [point]);

  // Find data from shared map instead of fetching individually
  const data = useMemo(() => {
    return pickLubricationData(lubricationDataMap, dbNameCandidates);
  }, [lubricationDataMap, dbNameCandidates]);

  const markerColor = useMemo(() => {
    if (!dbNameCandidates.length) {
      return defaultColor;
    }

    return GRADE_RGB[resolveLubricationGrade(data?.actualAmount ?? null, data?.plannedAmount ?? null)];
  }, [data, dbNameCandidates, defaultColor]);

  const shouldShowLabel = Boolean(point.markerLabel) && (Boolean(point.alwaysShowLabel) || isActive);

  return (
    <button
      type="button"
      className={`diagram-marker ${isActive ? "diagram-marker--active" : ""}`}
      data-point-id={point.id}
      style={{
        "--marker-x": `${point.xPercent}%`,
        "--marker-y": `${point.yPercent}%`,
        "--marker-rgb": markerColor,
        "--marker-size": `${point.markerScale ?? 1}rem`,
      } as CSSProperties}
      onClick={() => onClick(point)}
      onMouseEnter={() => onHover?.(point)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(point)}
      onBlur={() => onHover?.(null)}
      aria-label={point.name}
    >
      <span className="diagram-marker__pulse" aria-hidden="true" />
      <span className="diagram-marker__dot" aria-hidden="true" />
      {shouldShowLabel ? (
        <DiagramTooltip
          text={point.markerLabel ?? ""}
          isVisible={shouldShowLabel}
          variant={point.markerLabelVariant ?? "default"}
        />
      ) : null}
    </button>
  );
};

export default DiagramMarker;
