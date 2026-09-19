import { clockInYard, dateInYard } from '../careHistory';
import type { CareEvent, GrassProfile, WateringPlan, WeatherSnapshot, YardSegment } from '../types';
import { evaluateDay } from './rules';

export { wateringAmount } from './rules';

export function buildWateringOutlook(
  weather: WeatherSnapshot, profile: GrassProfile, segment: YardSegment, events: CareEvent[], now = new Date(),
): WateringPlan[] {
  const today = dateInYard(now, weather.timezone);
  const clock = clockInYard(now, weather.timezone);
  const stale = now.getTime() - Date.parse(weather.fetchedAt) > 2 * 60 * 60_000;
  return weather.daily.filter((day) => day.date >= today).slice(0, 5).map((day) => stale
    ? { date: day.date, status: 'check-soil', label: 'Refresh forecast', reason: 'This forecast is over two hours old. Refresh before deciding.', timing: '' }
    : evaluateDay(day, { weather, profile, segment, events, today, clock }));
}

export function combineYardOutlooks(outlooks: { segment: YardSegment; days: WateringPlan[] }[]): WateringPlan[] {
  const priority = { 'water-now': 3, 'check-soil': 2, wait: 1, skip: 0 };
  return (outlooks[0]?.days ?? []).map((_, index) => {
    const choices = outlooks.map(({ segment, days }) => ({ segment, plan: days[index] })).filter((item) => item.plan);
    choices.sort((a, b) => priority[b.plan.status] - priority[a.plan.status]);
    const chosen = choices.find((item) => item.plan.label === 'Check product label') ?? choices[0];
    const differs = choices.some((item) => item.plan.reason !== chosen.plan.reason);
    return { ...chosen.plan, reason: differs ? `${chosen.segment.name}: ${chosen.plan.reason}` : chosen.plan.reason };
  });
}
