import type { CareEvent, GrassInsights, GrassProfile, YardSegment } from './types';

function daysSince(dateText: string | undefined, now: Date): number | null {
  if (!dateText) return null;
  const timestamp = Date.parse(`${dateText}T12:00:00`);
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 86_400_000));
}

function lastEvent(events: CareEvent[], type: CareEvent['type'], segmentId: string): CareEvent | undefined {
  return events.filter((event) => event.type === type && event.segmentId === segmentId).sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function deriveGrassInsights(
  profile: GrassProfile,
  segment: YardSegment,
  events: CareEvent[],
  now = new Date(),
): GrassInsights {
  const lastFertilized = lastEvent(events, 'fertilized', segment.id);
  const lastWeedControl = lastEvent(events, 'weed-control', segment.id);
  const fertilizerDays = daysSince(lastFertilized?.at, now);
  const weedDays = daysSince(lastWeedControl?.at, now);
  const weedList = profile.weedTypes.length > 0 ? profile.weedTypes.join(', ') : 'the weeds you can identify';
  const propagation = segment.condition === 'strong'
    ? 'This is your donor zone: photograph the best patch, mark its boundaries, and expand from healthy runners, plugs, or seed only after the soil is ready.'
    : 'Treat the strong back-lawn patch as a small experiment. Fix compaction and soil contact first, then move plugs or seed into one measured test square.';
  const weedPlan = weedDays === null
    ? `Identify ${weedList} before spraying. Log the product and label rate so you can see what actually works.`
    : `Weed control was logged ${weedDays} day${weedDays === 1 ? '' : 's'} ago. Wait the label interval before repeating, and do not stack products because the lawn looks slow.`;
  const fertilizerPlan = fertilizerDays === null
    ? 'No fertilizer is logged. A soil test and a slow-release product beat guessing with extra bags.'
    : `Fertilizer was logged ${fertilizerDays} day${fertilizerDays === 1 ? '' : 's'} ago. Watch the color and growth before adding more.`;
  const baselineMinutes = Math.max(5, Math.round(segment.sprinklerMinutes * (profile.sprinklerMinutes / 20)));
  const sprinklerPlan = segment.slope === 'flat'
    ? `Run the movable sprinkler for ${baselineMinutes} minutes, then use a catch cup to calibrate the actual depth.`
    : `Use ${Math.max(8, Math.round(baselineMinutes / 2))} minutes, pause to soak in, then repeat. Move slightly uphill on the next pass to improve overlap.`;
  const actions = [
    profile.grassType === 'mixed-unsure' ? 'Take a close-up photo of one healthy blade and one weed before buying seed or herbicide.' : `Keep ${profile.grassType.replaceAll('-', ' ')} in mind when choosing the repair window.`,
    segment.sun === 'shade' ? 'Expect slower growth at the treeline; reduce competition before increasing fertilizer.' : 'Use the sunny edge as the benchmark for how much growth the zone can support.',
    fertilizerPlan,
  ];

  return {
    headline: `${segment.name} needs a ${segment.condition === 'strong' ? 'protect and multiply' : 'small, repeatable'} plan.`,
    actions,
    propagation,
    weedPlan,
    sprinklerPlan,
  };
}

export function grassTypeLabel(value: GrassProfile['grassType']): string {
  return {
    'tall-fescue': 'Tall fescue',
    'kentucky-bluegrass': 'Kentucky bluegrass',
    'perennial-ryegrass': 'Perennial ryegrass',
    bermuda: 'Bermuda',
    zoysia: 'Zoysia',
    'st-augustine': 'St. Augustine',
    centipede: 'Centipede',
    'mixed-unsure': 'Mixed / not sure yet',
  }[value];
}
