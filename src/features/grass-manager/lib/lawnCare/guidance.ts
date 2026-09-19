import { daysBetween, lastCare } from '../careHistory';
import type { CareEvent, GrassProfile, WeatherSnapshot } from '../types';
import { WHOLE_YARD } from '../yard';
import { GRASS_LABELS, SOURCES, WEED_RULES } from './content';

export interface WeedAdvice { name: string; action: string; note: string; timing: string; source: string }

export function weedAdvice(name: string, profile: GrassProfile, date?: string): WeedAdvice {
  const rule = WEED_RULES.find((item) => item.aliases.includes(name.toLowerCase().trim()));
  if (!rule) return { name, action: 'Identify first', note: 'A close-up ID comes before chemical choice. “Broadleaf” or “grassy” alone is not enough.', timing: '', source: SOURCES.weeds };
  const season = date ? growingSeason(profile, date) : 'unknown';
  const lateAnnual = season === 'fall' && ['Crabgrass', 'Spurge'].includes(rule.name);
  const manual = lateAnnual || profile.weedCoverage === 'scattered' || profile.grassType === 'mixed-unsure' ||
    profile.lawnStage === 'seeding' || profile.lawnStage === 'new-seed';
  const dormant = profile.lawnStage === 'dormant';
  const fallTarget = ['Dandelion', 'Clover', 'Ground ivy', 'Plantain'].includes(rule.name);
  const action = dormant ? 'Wait for active growth' : lateAnnual ? 'Pull mature plants' : manual ? 'Hand removal'
    : fallTarget && season === 'fall' ? 'Fall spot treatment' : fallTarget && season !== 'unknown' && season !== 'tropical'
      ? 'Plan fall treatment' : 'Targeted treatment';
  return {
    name: rule.name, action,
    note: dormant ? 'Avoid spraying dormant or stressed turf. Identify the weed now and treat only when the label and active growth allow.'
      : manual ? rule.manual : rule.chemical, timing: rule.timing, source: rule.source,
  };
}

export function growingSeason(profile: GrassProfile, date: string): string {
  const latitude = profile.location?.latitude;
  if (latitude === undefined) return 'unknown';
  if (Math.abs(latitude) < 23.5) return 'tropical';
  const month = (Number(date.slice(5, 7)) - 1 + (latitude < 0 ? 6 : 0)) % 12;
  return ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'][month];
}

export function seasonalNote(profile: GrassProfile, date: string): string {
  const season = growingSeason(profile, date);
  if (profile.lawnStage === 'seeding' || profile.lawnStage === 'new-seed') {
    return 'Repair comes first: most pre-emergents block grass seed too. Hand-weed; check all reseeding intervals before chemicals.';
  }
  if (season === 'unknown') return 'Choose a weather location for seasonal timing. Identify grass before selecting a herbicide.';
  if (season === 'tropical') return 'Use local wet/dry-season guidance; temperate spring/fall calendars do not fit this location.';
  const crabgrass = profile.weedTypes.some((weed) => /crab.?grass/i.test(weed));
  if (crabgrass) {
    return season === 'spring'
      ? 'Prevention window: before crabgrass germinates near 55°F soil for several days. Check local soil readings; most preventers conflict with seeding.'
      : 'Next season: plan crabgrass prevention before spring germination, not after weeds appear. Do not combine it blindly with seeding.';
  }
  if (profile.grassType === 'mixed-unsure') return 'Identify the healthy grass first; it determines your seed, repair season, and grass-safe chemical options.';
  const cool = ['tall-fescue', 'kentucky-bluegrass', 'perennial-ryegrass'].includes(profile.grassType);
  if (cool && season === 'fall') return 'Fall: repair thin spots with matching seed. Prioritize seeding or weed treatment—the label decides the gap between them.';
  if (!cool && season === 'summer') return 'Active summer growth is the repair window for warm-season turf. Use matching plugs or sod; avoid work on heat-stressed grass.';
  if (season === 'winter') return 'Winter: identify problem patches and plan repairs. Skip herbicides on dormant weeds and fertilizer on dormant grass.';
  return cool ? 'Plan major cool-season repairs for early fall; soil-test before choosing fertilizer.'
    : 'Wait for sustained active growth to repair warm-season grass. Do not fertilize it out of dormancy.';
}

export function treatmentNote(profile: GrassProfile, events: CareEvent[], date: string, weather: WeatherSnapshot | null): string {
  const chemical = lastCare(events, 'weed-control', WHOLE_YARD, date);
  const fertilizer = lastCare(events, 'fertilized', WHOLE_YARD, date);
  if (chemical && daysBetween(chemical.at, date) <= 30) {
    return `${chemical.product || 'Weed treatment'} logged ${chemical.at}. Let it work; the label sets retreatment and reseeding intervals.`;
  }
  if (fertilizer && daysBetween(fertilizer.at, date) <= 30) {
    return `Fertilized ${fertilizer.at}. Do not add another dose just because growth is slow; follow the product interval.`;
  }
  if (profile.grassType === 'mixed-unsure') return 'Grass unidentified: no chemical recommendation yet.';
  if (profile.weedCoverage === 'scattered') return 'A few weeds: hands-on removal usually gives the cleanest result with the least lawn damage.';
  if (profile.weedCoverage === 'widespread') return 'Mostly weeds? Repair one small area in your grass’s growing season. Fix coverage and soil instead of repeating blanket sprays.';
  if (!weather) return 'Before spraying, check wind, heat, rainfast time, and the product’s grass-species label.';
  const day = weather.daily.find((item) => item.date === date);
  if (weather.current.windSpeed >= 10 || weather.current.temperature >= 85 || (day?.precipitation ?? 0) >= 0.1) {
    return 'Poor spray window: wind, heat, or rain may interfere. Wait and check the product’s limits.';
  }
  return `Before spot treatment, confirm the label allows ${GRASS_LABELS[profile.grassType]} and the identified weed. Rainfast time and temperature limits vary.`;
}
