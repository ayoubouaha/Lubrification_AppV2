import { type DiagramPoint } from '../types';

const buildPoint = (
  id: string,
  xPercent: number,
  yPercent: number,
  tagPrimary: string,
  dbName: string,
  frequency: string,
  plannedAmount: string,
): DiagramPoint => {
  return {
    id,
    name: id,
    shortDescription: '',
    details: '',
    tagPrimary,
    dbName,
    frequency,
    plannedAmount,
    // Split markers are spaced ~5% apart so they don't sit too close on the rotation schema.
    splitGapXPercent: 5,
    xPercent,
    yPercent,
  };
};

export const ROTATION_DRIVE_GROUPS_LEFT_POINTS: DiagramPoint[] = [
  buildPoint('drive-left-1', 50.87, 7.56, 'K3-SROT-M01', 'K3-SROT-M01', '02,5ans', '30g'),
  buildPoint('drive-left-2', 50.5, 25.73, 'K3-SROT-M02', 'K3-SROT-M02', '02,5ans', '30g'),
];

export const ROTATION_DRIVE_GROUPS_RIGHT_POINTS: DiagramPoint[] = [
  buildPoint('drive-right-1', 57.97, 8.15, 'K3-SROT-M03', 'K3-SROT-M03', '02,5ans', '30g'),
  buildPoint('drive-right-2', 57.76, 25.47, 'K3-SROT-M04', 'K3-SROT-M04', '02,5ans', '30g'),
];

