import { getWeatherCodeInfo } from './weatherCodes';
import { weatherTimeLabel } from './weatherTime';
import type {
  CareEvent,
  DailyWeather,
  GrassProfile,
  WateringPlan,
  YardSegment,
} from './types';

const GRASS_INTERVAL_DAYS: Record<GrassProfile['grassType'], number> = {
  'tall-fescue': 5,
  'kentucky-bluegrass': 5,
  'perennial-ryegrass': 5,
  bermuda: 4,
  zoysia: 5,
  'st-augustine': 4,
  centipede: 6,
  'mixed-unsure': 5,
};

const WARM_SEASON_GRASS = new Set(['bermuda', 'zoysia', 'st-augustine', 'centipede']);

function daysSince(dateText: string | undefined, now: Date): number | null {
  if (!dateText) return null;
  const timestamp = Date.parse(`${dateText}T12:00:00`);
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 86_400_000));
}

function lastEvent(events: CareEvent[], type: CareEvent['type'], segmentId: string): CareEvent | undefined {
  return events
    .filter((event) => event.type === type && event.segmentId === segmentId)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
}

function targetDays(profile: GrassProfile, segment: YardSegment): number {
  const sunAdjustment = segment.sun === 'full-sun' ? -1 : segment.sun === 'shade' ? 1 : 0;
  const slopeAdjustment = segment.slope === 'steep-slope' ? 1 : 0;
  return Math.max(3, GRASS_INTERVAL_DAYS[profile.grassType] + sunAdjustment + slopeAdjustment);
}

function wateringMinutes(profile: GrassProfile, segment: YardSegment, hot: boolean): number {
  const typeAdjustment = WARM_SEASON_GRASS.has(profile.grassType) ? 1.05 : 1;
  const hotAdjustment = hot ? 1.15 : 1;
  const passAdjustment = profile.sprinklerMinutes / 20;
  return Math.max(8, Math.round(segment.sprinklerMinutes * passAdjustment * typeAdjustment * hotAdjustment));
}

function timingFor(day: DailyWeather, now: Date, rainy: boolean): string {
  const sunrise = weatherTimeLabel(day.sunrise);
  const sunset = weatherTimeLabel(day.sunset);
  if (rainy) return `After the rain window, then reassess before ${sunrise} tomorrow`;
  if (now.getHours() < 9) return `Today between ${sunrise} and 9:00 AM`;
  return `Tomorrow between ${sunrise} and 9:00 AM`;
}

function basePlan(
  status: WateringPlan['status'],
  label: string,
  headline: string,
  detail: string,
  timing: string,
  minutes: number,
  reasons: string[],
  watchFor: string,
): WateringPlan {
  return { status, label, headline, detail, timing, minutes, reasons, watchFor };
}

export function evaluateWateringPlan(
  day: DailyWeather,
  profile: GrassProfile,
  segment: YardSegment,
  events: CareEvent[],
  now = new Date(),
): WateringPlan {
  const info = getWeatherCodeInfo(day.weatherCode);
  const lastWater = lastEvent(events, 'watered', segment.id);
  const wateredDaysAgo = daysSince(lastWater?.at, now);
  const interval = targetDays(profile, segment);
  const due = wateredDaysAgo === null || wateredDaysAgo >= interval;
  const rain = day.precipitation >= 0.2 || (day.precipitationProbability >= 65 && day.precipitation >= 0.08);
  const freeze = info.waterSignal === 'freeze' || day.temperatureMin <= 35;
  const hot = day.temperatureMax >= 86;
  const windy = day.windSpeedMax >= 20;
  const dryWeather = !rain && info.waterSignal === 'drying';
  const sunset = weatherTimeLabel(day.sunset);
  const minutes = wateringMinutes(profile, segment, hot);
  const daysLabel = wateredDaysAgo === null ? 'No watering is logged yet' : `Last watered ${wateredDaysAgo} day${wateredDaysAgo === 1 ? '' : 's'} ago`;

  if (freeze) {
    return basePlan(
      'skip',
      'Hold off',
      'Let frozen or snow-covered ground rest.',
      `${info.label} and a ${day.temperatureMin}°F low make irrigation wasteful and potentially harmful.`,
      `Recheck after the overnight low rises above 40°F; sunrise is ${weatherTimeLabel(day.sunrise)}.`,
      0,
      [info.label, `Low of ${day.temperatureMin}°F`, daysLabel],
      'Look for thawed soil before walking or watering the lawn.',
    );
  }

  if (rain) {
    return basePlan(
      'skip',
      'Rain is doing the work',
      'Skip the sprinkler and bank the free water.',
      `${info.label} brings ${day.precipitation.toFixed(2)} in of precipitation with a ${day.precipitationProbability}% rain chance.`,
      timingFor(day, now, true),
      0,
      [info.label, `${day.precipitation.toFixed(2)} in forecast`, `${day.precipitationProbability}% precipitation chance`],
      `If the storm misses your yard, reassess after sunset at ${sunset} rather than watering on autopilot.`,
    );
  }

  if (!due && !hot) {
    return basePlan(
      'wait',
      'Wait and watch',
      'The lawn is not due for a deep soak yet.',
      `${daysLabel}. The ${segment.shortName.toLowerCase()} target is roughly every ${interval} days in these conditions.`,
      `Use the next cool morning; avoid watering after sunset at ${sunset}.`,
      Math.max(8, Math.round(minutes * 0.6)),
      [info.label, `${day.temperatureMax}°F high`, daysLabel],
      'Step on a thin or dull patch. If footprints stay visible, check the soil before adding water.',
    );
  }

  if (dryWeather && due) {
    const hillAdvice = segment.slope === 'flat' ? '' : ' Split that total into two passes with a 20-minute soak-in pause.';
    return basePlan(
      'water-now',
      hot ? 'Deep soak due' : 'Watering window',
      hot ? 'Give this zone a slow, deep drink.' : 'A measured soak will help this zone recover.',
      `${info.label}, a ${day.temperatureMax}°F high, and ${day.sunshineDuration > 21_600 ? 'a long sunny day' : 'limited cloud cover'} will pull moisture from the root zone.${hillAdvice}`,
      timingFor(day, now, false),
      minutes,
      [info.label, `${day.temperatureMax}°F high`, daysLabel, `${day.windSpeedMax} mph peak wind`],
      `Stop before runoff. Sunset is ${sunset}; foliage should be dry before then.`,
    );
  }

  return basePlan(
    due ? 'check-soil' : 'wait',
    due ? 'Check the soil first' : 'No rush today',
    due ? 'Use a finger test before moving the sprinkler.' : 'Clouds and mild temperatures are buying you time.',
    `${info.label} with a ${day.temperatureMax}°F high is gentler than a hot clear day. Water only if the top 2–3 inches are dry.`,
    `If the soil is dry, water before 9:00 AM; sunset is ${sunset}.`,
    due ? minutes : Math.max(8, Math.round(minutes * 0.6)),
    [info.label, `${day.temperatureMax}°F high`, daysLabel, windy ? `${day.windSpeedMax} mph wind` : 'low evaporation pressure'],
    segment.slope === 'flat' ? 'A tuna-can depth check beats guessing from the color of the blades.' : 'On the slope, use short cycles and watch the downhill edge for runoff.',
  );
}
