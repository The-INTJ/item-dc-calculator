import type { GrassProfile, YardSegment } from '../types';

export function zoneAdvice(profile: GrassProfile, segment: YardSegment): string {
  if (segment.sun === 'shade') return 'Low light limits thick turf. Try a shade-suited grass or a bed edge; extra fertilizer cannot replace sun.';
  if (segment.condition === 'strong') {
    if (['tall-fescue', 'perennial-ryegrass'].includes(profile.grassType)) {
      return 'This grass grows in bunches, so it will not rapidly fill big gaps. Match its seed for nearby repairs; keep this healthy patch intact.';
    }
    if (profile.grassType === 'mixed-unsure') return 'Identify this healthy patch first. Bunch grasses need matching seed; spreading grasses can fill outward or supply a few plugs.';
    return 'Protect this healthy patch. In its active growing season, trial a few matching plugs at the edge of a prepared bare spot; do not strip the donor area.';
  }
  if (segment.condition === 'weedy') return 'For a small patch, pull roots, then repair the opening. For a mostly weedy area, plan staged renovation and matching grass—not repeated blanket spraying.';
  if (segment.condition === 'bare' || segment.condition === 'thin') return 'Repair soil contact and coverage first. Test matching seed or plugs in one small area before repeating across the yard.';
  return segment.note;
}
