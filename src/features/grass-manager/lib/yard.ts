import type { YardSegment } from './types';

export const YARD_SEGMENTS: YardSegment[] = [
  {
    id: 'back-lawn',
    name: 'Back lawn',
    shortName: 'Back',
    sun: 'part-sun',
    slope: 'flat',
    condition: 'strong',
    area: 'back',
    sprinklerMinutes: 28,
    note: 'Your best-looking grass lives here. Use it as the donor zone for expansion.',
  },
  {
    id: 'left-side',
    name: 'Left side strip',
    shortName: 'Left side',
    sun: 'full-sun',
    slope: 'flat',
    condition: 'weedy',
    area: 'left-side',
    sprinklerMinutes: 14,
    note: 'Narrow strips dry quickly. Water in a pass that overlaps the edge of the bed.',
  },
  {
    id: 'right-side-hill',
    name: 'Right side hill',
    shortName: 'Hill',
    sun: 'part-sun',
    slope: 'gentle-slope',
    condition: 'thin',
    area: 'right-side',
    sprinklerMinutes: 18,
    note: 'Use short pulses with a soak-in pause so water does not run downhill.',
  },
  {
    id: 'front-square',
    name: 'Front square',
    shortName: 'Front',
    sun: 'full-sun',
    slope: 'flat',
    condition: 'bare',
    area: 'front',
    sprinklerMinutes: 16,
    note: 'A small, visible test plot: repair the soil here before scaling the same fix out.',
  },
  {
    id: 'treeline-edge',
    name: 'Treeline edge',
    shortName: 'Treeline',
    sun: 'shade',
    slope: 'flat',
    condition: 'weedy',
    area: 'back',
    sprinklerMinutes: 20,
    note: 'Tree roots compete for water. Favor shade-tolerant grass or a deliberate bed edge.',
  },
];

export const DEFAULT_PROFILE = {
  grassType: 'mixed-unsure' as const,
  weedTypes: ['broadleaf', 'crabgrass'],
  sprinklerMinutes: 20,
  locationName: '',
  location: null,
};

export function getSegment(id: string): YardSegment {
  return YARD_SEGMENTS.find((segment) => segment.id === id) ?? YARD_SEGMENTS[0];
}

export function describeSun(sun: YardSegment['sun']): string {
  return { 'full-sun': 'Full sun', 'part-sun': 'Part sun', shade: 'Shade' }[sun];
}

export function describeSlope(slope: YardSegment['slope']): string {
  return {
    flat: 'Flat',
    'gentle-slope': 'Gentle slope',
    'steep-slope': 'Steep slope',
  }[slope];
}

export function describeCondition(condition: YardSegment['condition']): string {
  return { strong: 'Strong grass', thin: 'Thin', weedy: 'Weedy', bare: 'Bare patches' }[
    condition
  ];
}
