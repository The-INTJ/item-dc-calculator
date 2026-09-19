import { daysBetween, lastCare } from '../careHistory';
import type { CareEvent, DailyWeather, GrassProfile, WateringPlan, WeatherSnapshot, YardSegment } from '../types';
import { getWeatherCodeInfo } from '../weatherCodes';
import { weatherTimeLabel } from '../weatherTime';
import { rainWindow, recentRain } from './forecast';

interface Context {
  weather: WeatherSnapshot; profile: GrassProfile; segment: YardSegment;
  events: CareEvent[]; today: string; clock: string;
}

function dryingInterval(day: DailyWeather, segment: YardSegment): number {
  const temperature = day.temperatureMax >= 86 ? 3 : day.temperatureMax < 65 ? 6 : 4;
  const cloud = day.sunshineDuration < 10_800 && day.temperatureMax < 80 ? 1 : 0;
  return temperature + cloud + (segment.sun === 'shade' ? 1 : 0);
}

export function wateringAmount(profile: GrassProfile, segment?: YardSegment): string {
  const minutes = profile.sprinklerInches
    ? Math.round(0.5 / profile.sprinklerInches * profile.sprinklerMinutes) : null;
  const amount = minutes ? `About ${minutes} min per position for ½ in., based on your catch cups.`
    : 'Use catch cups to measure ½ in.; minutes alone cannot measure coverage.';
  return amount + (segment?.slope !== 'flat' && segment ? ' Split into short cycles; stop before runoff.' : ' Stop at runoff and let it soak in.');
}

function morning(day: DailyWeather, context: Context): string {
  if (day.date !== context.today || context.clock.slice(11) < '09:00') {
    return `Morning, after ${weatherTimeLabel(day.sunrise)}`;
  }
  const tomorrow = context.weather.daily.find((item) => daysBetween(day.date, item.date) === 1);
  return tomorrow ? `Next morning, after ${weatherTimeLabel(tomorrow.sunrise)}` : 'Next calm morning';
}

function chemicalNote(context: Context, date: string): string | null {
  for (const type of ['weed-control', 'fertilized'] as const) {
    const event = lastCare(context.events, type, context.segment.id, context.today);
    if (event && daysBetween(event.at, date) < 2) {
      return `${event.product || (type === 'fertilized' ? 'Fertilizer' : 'Weed treatment')} logged ${event.at}. Check its water-in / rainfast directions before irrigation.`;
    }
  }
  return null;
}

export function evaluateDay(day: DailyWeather, context: Context): WateringPlan {
  const { weather, profile, segment, events, today, clock } = context;
  const result = (status: WateringPlan['status'], label: string, reason: string, timing = '') =>
    ({ date: day.date, status, label, reason, timing });
  const current = day.date === today;
  const info = getWeatherCodeInfo(current ? weather.current.weatherCode : day.weatherCode);
  const rain = rainWindow(weather, current ? clock : `${day.date}T06:00`);
  if (day.temperatureMin <= 32 || info.waterSignal === 'freeze') {
    return result('skip', 'Skip · frost', 'Freezing or snowy conditions. Wait for thawed, unfrozen soil.');
  }
  if (current && info.waterSignal === 'wet') {
    return result('skip', 'Skip · raining', 'Rain or storms now. Recheck the soil after they pass.');
  }
  const chemical = chemicalNote(context, day.date);
  if (chemical) return result('check-soil', 'Check product label', chemical);
  if (profile.lawnStage === 'new-seed') {
    return result('check-soil', 'Check seedbed', 'New seed needs the surface kept moist, not a deep-soak schedule. Check between showers; never let it puddle.');
  }
  if (profile.lawnStage === 'dormant') {
    return result('check-soil', 'Check dormant turf', 'Do not force green-up. Check local survival-watering guidance during prolonged drought.');
  }
  if (rain.amount >= 0.15 && rain.probability >= 60) {
    const when = rain.first?.startsWith(day.date) ? weatherTimeLabel(rain.first) : 'tomorrow';
    return result('wait', 'Wait for rain', `~${rain.amount.toFixed(2)} in. forecast in the next 24h, starting ${when}. Recheck if it misses your yard.`);
  }
  const last = lastCare(events, 'watered', segment.id, today);
  const age = last ? daysBetween(last.at, day.date) : null;
  if (age !== null && age < 2) {
    return result('wait', 'Wait · watered', `Watered ${last!.at}. Check that the soil absorbed it before adding more.`);
  }
  const rainTotal = recentRain(weather, day.date, today, clock);
  if (rainTotal >= 0.25) {
    return result('wait', 'Wait · recent rain', `~${rainTotal.toFixed(2)} in. ${current ? 'estimated recently' : 'expected beforehand'}. Check soil; forecast rain is not a rain gauge.`);
  }
  if (!rain.complete || (rain.amount >= 0.15 && rain.probability < 60)) {
    return result('check-soil', 'Check before watering', 'Rain timing is uncertain. Check the forecast and soil before running the sprinkler.');
  }
  if ((current ? weather.current.windSpeed : day.windSpeedMax) >= 15) {
    return result('wait', 'Wait · windy', 'Wind wastes sprinkler coverage. Recheck for a calm morning.');
  }
  const interval = dryingInterval(day, segment);
  const history = weather.daily.filter((item) => daysBetween(item.date, day.date) > 0 && daysBetween(item.date, day.date) <= interval);
  const dryHistory = history.length >= interval && history.reduce((sum, item) => sum + item.precipitation, 0) < 0.15;
  if ((age !== null && age >= interval) || (age === null && dryHistory)) {
    return result('water-now', 'Water if dry', 'No useful rain soon. If soil is dry 3–4 in. down or footprints linger, soak the dry areas.', morning(day, context));
  }
  const reason = day.temperatureMax >= 86 ? 'Heat speeds drying; check sunny areas first.'
    : day.temperatureMax < 65 || day.sunshineDuration < 10_800 ? 'Cooler or cloudy weather slows drying; do not water just by the calendar.'
    : 'No useful rain soon, but soil moisture is unknown.';
  return result('check-soil', 'Check soil', `${reason} Water only if dry 3–4 in. down.`, morning(day, context));
}
