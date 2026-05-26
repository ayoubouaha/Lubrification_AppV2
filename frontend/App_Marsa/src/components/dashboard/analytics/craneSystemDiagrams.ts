import type { CraneConfig } from '../../../config/cranesConfig';
import type { DiagramPoint } from '../../diagram/types';
import { getZoneDiagramConfig, type ZoneKey } from '../../diagram/zones/zoneDiagram.config';
import { ARDELT_TRANSLATION_MARKERS } from '../../diagram/translation/ardeltTranslationMarkers';
import { TUKAN_TRANSLATION_MARKERS } from '../../diagram/translation/tukanTranslationMarkers';
import { TUKAN_TRANSLATION_ZONE_A_MARKERS } from '../../diagram/translation/tukanTranslationZoneAMarkers';
import { TUKAN_TRANSLATION_ZONE_B_MARKERS } from '../../diagram/translation/tukanTranslationZoneBMarkers';
import { TUKAN_TRANSLATION_ZONE_C_MARKERS } from '../../diagram/translation/tukanTranslationZoneCMarkers';
import { TUKAN_TRANSLATION_ZONE_D_MARKERS } from '../../diagram/translation/tukanTranslationZoneDMarkers';
import { ROTATION_DIAGRAM_CONFIG } from '../../diagram/rotation/rotationDiagram.config';
import {
  ROTATION_DRIVE_GROUPS_LEFT_POINTS,
  ROTATION_DRIVE_GROUPS_RIGHT_POINTS,
} from '../../diagram/rotation/rotationDriveGroups.config';
import {
  TUKAN_ROTATION_DRIVE_GROUPS_LEFT_POINTS,
  TUKAN_ROTATION_DRIVE_GROUPS_RIGHT_POINTS,
} from '../../diagram/rotation/rotationDriveGroups.tukan.config';
import { RELEVAGE_LINK_POINTS } from '../../diagram/relevage/relevageDiagram.config';
import { RELEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/relevage/relevageDriveGroups.config';
import { TUKAN_RELEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/relevage/relevageDriveGroups.tukan.config';
import { LEVAGE_LINK_POINTS } from '../../diagram/levage/levageDiagram.config';
import { LEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/levage/levageDriveGroups.config';
import { TUKAN_LEVAGE_DRIVE_GROUPS_POINTS } from '../../diagram/levage/levageDriveGroups.tukan.config';
import {
  getPouliesDriveGroupsPoints,
  getPouliesOverviewPoints,
  getTukanPouliesOverviewPoints,
} from '../../diagram/poulies/pouliesPoints';

export interface DiagramView {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  points: DiagramPoint[];
  size: 'default' | 'compact' | 'small';
}

export interface SystemDef {
  id: string;
  label: string;
  getViews: (crane: CraneConfig) => DiagramView[];
  resolveLink?: (crane: CraneConfig, point: DiagramPoint) => string | null;
}

const isTukan = (crane: CraneConfig) => crane.id === 'tukan';

const TUKAN_ZONE_MARKERS: Record<ZoneKey, DiagramPoint[]> = {
  'nord-a': TUKAN_TRANSLATION_ZONE_A_MARKERS,
  'sud-b': TUKAN_TRANSLATION_ZONE_B_MARKERS,
  'sud-c': TUKAN_TRANSLATION_ZONE_C_MARKERS,
  'nord-d': TUKAN_TRANSLATION_ZONE_D_MARKERS,
};

const zoneSystem = (zoneKey: ZoneKey, label: string): SystemDef => ({
  id: `translation:${zoneKey}`,
  label,
  getViews: crane => {
    const config = getZoneDiagramConfig(zoneKey, crane.images);
    return [
      {
        title: config.title,
        subtitle: config.subtitle,
        imageSrc: config.imageSrc,
        imageAlt: config.imageAlt,
        points: isTukan(crane) ? TUKAN_ZONE_MARKERS[zoneKey] : config.points,
        size: isTukan(crane) ? 'compact' : 'default',
      },
    ];
  },
});

export const CRANE_SYSTEMS: SystemDef[] = [
  {
    id: 'translation',
    label: 'Translation',
    getViews: crane => [
      {
        title: 'SYSTÈME DE TRANSLATION',
        subtitle: '',
        imageSrc: crane.images.translation ?? crane.images.nordA,
        imageAlt: 'Schéma du système de translation',
        points: crane.id === 'ardelt' ? ARDELT_TRANSLATION_MARKERS : TUKAN_TRANSLATION_MARKERS,
        size: 'compact',
      },
    ],
    resolveLink: (_crane, point) =>
      point.id.startsWith('translation-') ? `translation:${point.id.replace('translation-', '')}` : null,
  },
  zoneSystem('nord-a', 'Transl. A'),
  zoneSystem('sud-b', 'Transl. B'),
  zoneSystem('sud-c', 'Transl. C'),
  zoneSystem('nord-d', 'Transl. D'),
  {
    id: 'rotation',
    label: 'Rotation',
    getViews: crane => [
      {
        title: ROTATION_DIAGRAM_CONFIG.title,
        subtitle: ROTATION_DIAGRAM_CONFIG.subtitle,
        imageSrc: crane.images.rotation,
        imageAlt: ROTATION_DIAGRAM_CONFIG.imageAlt,
        points: ROTATION_DIAGRAM_CONFIG.points,
        size: 'compact',
      },
    ],
  },
  {
    id: 'rotation:groupes',
    label: 'Rotation · Groupes',
    getViews: crane => {
      const tukan = isTukan(crane);
      return [
        {
          title: "Groupes d'entraînement gauche",
          subtitle: '',
          imageSrc: crane.images.rotationDriveGroups,
          imageAlt: "Schéma groupes d'entraînement gauche",
          points: tukan ? TUKAN_ROTATION_DRIVE_GROUPS_LEFT_POINTS : ROTATION_DRIVE_GROUPS_LEFT_POINTS,
          size: 'compact',
        },
        {
          title: "Groupes d'entraînement droite",
          subtitle: '',
          imageSrc: crane.images.rotationDriveGroups,
          imageAlt: "Schéma groupes d'entraînement droite",
          points: tukan ? TUKAN_ROTATION_DRIVE_GROUPS_RIGHT_POINTS : ROTATION_DRIVE_GROUPS_RIGHT_POINTS,
          size: 'compact',
        },
      ];
    },
  },
  {
    id: 'relevage',
    label: 'Relevage',
    getViews: crane => [
      {
        title: 'SYSTÈME DE RELEVAGE DE LA FLÈCHE',
        subtitle: '',
        imageSrc: crane.images.relevage,
        imageAlt: 'Schéma du système de relevage de la flèche',
        points: RELEVAGE_LINK_POINTS,
        size: 'default',
      },
    ],
    resolveLink: (_crane, point) => (point.action === 'relevage-drive-groups' ? 'relevage:groupes' : null),
  },
  {
    id: 'relevage:groupes',
    label: 'Relevage · Groupes',
    getViews: crane => [
      {
        title: "Groupes d'entraînement",
        subtitle: '',
        imageSrc: crane.images.relevageDriveGroups,
        imageAlt: "Schéma relevage flèche groupes d'entraînement",
        points: isTukan(crane) ? TUKAN_RELEVAGE_DRIVE_GROUPS_POINTS : RELEVAGE_DRIVE_GROUPS_POINTS,
        size: 'compact',
      },
    ],
  },
  {
    id: 'levage',
    label: 'Levage',
    getViews: crane => [
      {
        title: 'SYSTÈME DE LEVAGE',
        subtitle: '',
        imageSrc: crane.images.levage,
        imageAlt: 'Schéma du système de levage',
        points: LEVAGE_LINK_POINTS,
        size: 'small',
      },
    ],
    resolveLink: () => 'levage:groupes',
  },
  {
    id: 'levage:groupes',
    label: 'Levage · Groupes',
    getViews: crane => [
      {
        title: "Groupes d'entraînement",
        subtitle: '',
        imageSrc: crane.images.levageDriveGroups,
        imageAlt: "Schéma levage groupes d'entraînement",
        points: isTukan(crane) ? TUKAN_LEVAGE_DRIVE_GROUPS_POINTS : LEVAGE_DRIVE_GROUPS_POINTS,
        size: isTukan(crane) ? 'compact' : 'small',
      },
    ],
  },
  {
    id: 'poulies',
    label: 'Poulies',
    getViews: crane => [
      {
        title: 'SYSTÈME DES POULIES DES CÂBLES',
        subtitle: '',
        imageSrc: crane.images.pouliesCables,
        imageAlt: 'Schéma poulies des câbles',
        points: isTukan(crane) ? getTukanPouliesOverviewPoints() : getPouliesOverviewPoints(crane.id),
        size: 'compact',
      },
    ],
    resolveLink: (_crane, point) => (point.id === 'poulies:drive-groups-nav' ? 'poulies:groupes' : null),
  },
  {
    id: 'poulies:groupes',
    label: 'Poulies · Groupes',
    getViews: crane => [
      {
        title: "Groupes d'entraînement",
        subtitle: '',
        imageSrc: crane.images.pouliesDriveGroups,
        imageAlt: "Schéma groupes d'entraînement système des poulies des câbles",
        points: getPouliesDriveGroupsPoints(crane.id),
        size: 'compact',
      },
    ],
  },
];

export const getSystemById = (id: string): SystemDef =>
  CRANE_SYSTEMS.find(system => system.id === id) ?? CRANE_SYSTEMS[0];
