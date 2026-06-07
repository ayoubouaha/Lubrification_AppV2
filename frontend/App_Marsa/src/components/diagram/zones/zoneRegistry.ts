import { type DiagramPoint } from '../types';
import { type CraneImages } from '../../../config/cranesConfig';
import { BASE_MARKERS, type MarkerId } from './markerCatalog';
import { PROFILE_COORDINATES, PROFILE_DISABLED_MARKERS, type ZoneProfile } from './coordinateProfiles';
import { PROFILE_MARKER_OVERRIDES } from './profileMarkerOverrides';

export type ZoneKey = 'nord-a' | 'sud-c' | 'nord-d' | 'sud-b';

interface ZoneDefinitionBase {
  title: string;
  subtitle: string;
  imageAlt: string;
  profile: ZoneProfile;
  tagLetter: 'A' | 'B' | 'C' | 'D';
  /** Shared markers to hide for THIS zone only (the others keep them). */
  hiddenMarkers?: readonly MarkerId[];
  /** Extra points that exist only in THIS zone (not part of the shared catalog). */
  extraPoints?: readonly DiagramPoint[];
}

const BASE_ZONE_REGISTRY: Record<ZoneKey, ZoneDefinitionBase> = {
  'nord-a': {
    title: 'Côté Mer / Nord - A',
    subtitle: '',
    imageAlt: 'Schema technique de la grue Coté Mer Nord A',
    profile: 'profile-ac',
    tagLetter: 'A',
    // K3-STR-A21 / A22 do not exist on this side: hide the biellette marker for zone A only
    // (zone C keeps the same marker as C21 / C22).
    hiddenMarkers: ['left-bogie-lower-link'],
  },
  'sud-c': {
    title: 'Côté Terre / Sud - C',
    subtitle: '',
    imageAlt: 'Schema technique de la grue Coté Terre Sud C',
    profile: 'profile-ac',
    tagLetter: 'C',
  },
  'nord-d': {
    title: 'Côté Terre / Nord - D',
    subtitle: '',
    imageAlt: 'Schema technique de la grue Coté Mer Nord D',
    profile: 'profile-db',
    tagLetter: 'D',
  },
  'sud-b': {
    title: 'Côté Mer / Sud - B',
    subtitle: '',
    imageAlt: 'Schema technique de la grue Coté Mer Sud B',
    profile: 'profile-db',
    tagLetter: 'B',
    // K3-STR-B19 / B20 exist only on side B. Placed near the spot marked in purple on the
    // schema; adjust xPercent / yPercent to fine-tune the marker position.
    extraPoints: [
      {
        id: 'sud-b-biellette-extra',
        name: 'K3-STR-B19 / K3-STR-B20',
        shortDescription: 'Biellette inferieure supplementaire',
        details: 'Point de graissage supplementaire cote B.',
        tagPrimary: 'K3-STR-B19',
        tagSecondary: 'K3-STR-B20',
        frequency: '07j',
        plannedAmount: '125g',
        xPercent: 35,
        yPercent: 55,
      },
    ],
  },
};

const LABEL_TO_ZONE_KEY: Record<string, ZoneKey> = {
  'cote mer / nord - a': 'nord-a',
  'cote terre / sud - c': 'sud-c',
  'cote mer / sud - c': 'sud-c',
  'cote mer / nord - d': 'nord-d',
  'cote terre / nord - d': 'nord-d',
  'cote mer / sud - b': 'sud-b',
  'cote terre / sud - b': 'sud-b',
};

const normalizeTagForLetter = (tag: string, letter: ZoneDefinitionBase['tagLetter']) => {
  return tag.replace(/^K3-STR-[A-Z]/, `K3-STR-${letter}`);
};

const buildPointsForProfile = (
  profile: ZoneProfile,
  tagLetter: ZoneDefinitionBase['tagLetter'],
  hiddenMarkers: ReadonlySet<MarkerId>,
): DiagramPoint[] => {
  const coordinateMap = PROFILE_COORDINATES[profile];
  const disabledMarkers = new Set(PROFILE_DISABLED_MARKERS[profile]);
  const markerOverrides = PROFILE_MARKER_OVERRIDES[profile];

  return BASE_MARKERS.filter(
    marker => !disabledMarkers.has(marker.id) && !hiddenMarkers.has(marker.id),
  ).map(marker => {
    const override = markerOverrides[marker.id];
    const mergedPoint: DiagramPoint = {
      ...marker,
      ...override,
      ...coordinateMap[marker.id]!,
    };

    if (profile === 'profile-db' && (!override || !('tagSecondary' in override))) {
      delete (mergedPoint as Partial<DiagramPoint>).tagSecondary;
    }

    mergedPoint.tagPrimary = normalizeTagForLetter(mergedPoint.tagPrimary, tagLetter);
    if (mergedPoint.tagSecondary) {
      mergedPoint.tagSecondary = normalizeTagForLetter(mergedPoint.tagSecondary, tagLetter);
    }

    return mergedPoint;
  });
};

const validateZoneRegistry = () => {
  for (const [zoneKey, zoneDefinition] of Object.entries(BASE_ZONE_REGISTRY)) {
    if (!PROFILE_COORDINATES[zoneDefinition.profile]) {
      throw new Error(`Zone ${zoneKey} references unknown profile ${zoneDefinition.profile}`);
    }
  }
};

validateZoneRegistry();

export const getZoneKeyFromLabel = (normalizedLabel: string): ZoneKey | null => {
  return LABEL_TO_ZONE_KEY[normalizedLabel] ?? null;
};

export const getZoneDiagramConfig = (zoneKey: ZoneKey, images: CraneImages) => {
  const zoneDefinition = BASE_ZONE_REGISTRY[zoneKey];
  const imageMap: Record<ZoneKey, string> = {
    'nord-a': images.nordA,
    'sud-c': images.sudC,
    'nord-d': images.nordD,
    'sud-b': images.sudB,
  };

  const points = [
    ...buildPointsForProfile(
      zoneDefinition.profile,
      zoneDefinition.tagLetter,
      new Set(zoneDefinition.hiddenMarkers ?? []),
    ),
    ...(zoneDefinition.extraPoints ?? []),
  ];

  return {
    title: zoneDefinition.title,
    subtitle: zoneDefinition.subtitle,
    imageSrc: imageMap[zoneKey],
    imageAlt: zoneDefinition.imageAlt,
    points,
  };
};
