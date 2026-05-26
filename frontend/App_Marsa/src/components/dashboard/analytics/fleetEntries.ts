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
  zone: string;
  stepId: StepId;
  dbCandidates: string[];
};

const ZONE_KEYS: ZoneKey[] = ['nord-a', 'sud-b', 'sud-c', 'nord-d'];
const TRANSLATION_ZONE_LABELS: Record<ZoneKey, string> = {
  'nord-a': 'Transl. A',
  'sud-b': 'Transl. B',
  'sud-c': 'Transl. C',
  'nord-d': 'Transl. D',
};
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

  const addEntry = (point: DiagramPoint, sectionLabel: string, zone: string, stepId: StepId) => {
    const dbCandidates = getDbNameCandidates(point);
    if (!dbCandidates.length) return;

    entries.push({
      point,
      label: makeLabel(point),
      tagLabel: point.tagPrimary || point.dbName || point.tagSecondary || point.name,
      sectionLabel,
      zone,
      stepId,
      dbCandidates,
    });
  };

  ZONE_KEYS.forEach(zoneKey => {
    const config = getZoneDiagramConfig(zoneKey, images);
    const points = isTukan ? TUKAN_ZONE_POINTS[zoneKey] : config.points;
    points.forEach(point => {
      addEntry(point, `Translation - ${config.title}`, TRANSLATION_ZONE_LABELS[zoneKey], `translation:${zoneKey}` as StepId);
    });
  });

  const rotationLeft = isTukan ? TUKAN_ROTATION_DRIVE_GROUPS_LEFT_POINTS : ROTATION_DRIVE_GROUPS_LEFT_POINTS;
  rotationLeft.forEach(point => addEntry(point, 'Rotation - Groupe gauche', 'Rotation', 'rotation:drive-groups'));

  const rotationRight = isTukan ? TUKAN_ROTATION_DRIVE_GROUPS_RIGHT_POINTS : ROTATION_DRIVE_GROUPS_RIGHT_POINTS;
  rotationRight.forEach(point => addEntry(point, 'Rotation - Groupe droite', 'Rotation', 'rotation:drive-groups'));

  const relevage = isTukan ? TUKAN_RELEVAGE_DRIVE_GROUPS_POINTS : RELEVAGE_DRIVE_GROUPS_POINTS;
  relevage.forEach(point => addEntry(point, 'Relevage - Groupes', 'Relevage', 'relevage:drive-groups'));

  const levage = isTukan ? TUKAN_LEVAGE_DRIVE_GROUPS_POINTS : LEVAGE_DRIVE_GROUPS_POINTS;
  levage.forEach(point => addEntry(point, 'Levage - Groupes', 'Levage', 'levage:drive-groups'));

  getPouliesDriveGroupsPoints(craneId).forEach(point => addEntry(point, 'Poulies - Groupes', 'Poulies', 'poulies:drive-groups'));

  const pouliesOverview = craneId === 'tukan' ? getTukanPouliesOverviewPoints() : getPouliesOverviewPoints(craneId);
  pouliesOverview
    .filter(point => !point.id.includes('nav'))
    .forEach(point => addEntry(point, 'Poulies - Systeme', 'Poulies', 'poulies'));

  return entries;
};
