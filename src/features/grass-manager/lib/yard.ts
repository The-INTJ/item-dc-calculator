import type { GrassProfile, YardSegment } from './types';

export const WHOLE_YARD = 'whole-yard';

export const YARD_SEGMENTS: YardSegment[] = [
  { id: 'back-lawn', name: 'Back lawn', shortName: 'Back lawn', sun: 'unknown', slope: 'flat', condition: 'unknown', area: 'back', sprinklerMinutes: 20, note: 'Check the shaded edge separately: tree roots can leave it dry even with less sun.' },
  { id: 'left-side-hill', name: 'Left side hill', shortName: 'Left · hill', sun: 'unknown', slope: 'gentle-slope', condition: 'unknown', area: 'left-side', sprinklerMinutes: 20, note: 'Stop before runoff. Move the sprinkler to another area, then return after this slope has absorbed the water.' },
  { id: 'right-side', name: 'Right side strip', shortName: 'Right side', sun: 'unknown', slope: 'flat', condition: 'unknown', area: 'right-side', sprinklerMinutes: 20, note: 'Keep the spray inside the narrow strip. Check overlapping edges with catch cups.' },
  { id: 'front-square', name: 'Front square', shortName: 'Front', sun: 'unknown', slope: 'flat', condition: 'unknown', area: 'front', sprinklerMinutes: 20, note: 'Use this small area to test a repair before repeating it across the yard.' },
];

export const DEFAULT_PROFILE: GrassProfile = {
  grassType: 'mixed-unsure', weedTypes: [], sprinklerMinutes: 20,
  weedCoverage: 'scattered', lawnStage: 'established', configured: false,
  locationName: '', location: null,
};

export function getSegment(id: string): YardSegment {
  return YARD_SEGMENTS.find((segment) => segment.id === id) ?? YARD_SEGMENTS[0];
}

export function segmentName(id: string): string {
  if (id === WHOLE_YARD) return 'Whole yard';
  if (id === 'treeline-edge') return 'Treeline (previous zone)';
  return YARD_SEGMENTS.find((segment) => segment.id === id)?.name ?? id;
}

export function describeSun(sun: YardSegment['sun']): string {
  return { unknown: 'Sun not set', 'full-sun': 'Full sun · 6+ hours', 'part-sun': 'Part sun · 3–6 hours', shade: 'Shade · under 3 hours' }[sun];
}

export function describeCondition(condition: YardSegment['condition']): string {
  return { unknown: 'Condition not set', strong: 'Healthy grass', thin: 'Thin grass', weedy: 'Mostly weeds', bare: 'Bare patches' }[condition];
}
