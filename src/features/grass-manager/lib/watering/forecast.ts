import { daysBetween } from '../careHistory';
import type { WeatherSnapshot } from '../types';

export function rainWindow(weather: WeatherSnapshot, start: string) {
  // Local forecast strings are compared in the yard timezone, never the browser's.
  const end = new Date(Date.parse(start + ':00Z') + 86_400_000).toISOString().slice(0, 16);
  const hours = weather.hourly.filter((hour) => hour.time > start && hour.time <= end);
  const complete = hours.length >= 23 && hours.every((hour) =>
    hour.precipitation !== null && hour.precipitationProbability !== null);
  const amount = hours.reduce((sum, hour) => sum + (hour.precipitation ?? 0), 0);
  const wetHours = hours.filter((hour) => (hour.precipitation ?? 0) >= 0.01);
  const probability = Math.max(0, ...wetHours.map((hour) => hour.precipitationProbability ?? 0));
  return { amount, probability, complete, first: wetHours[0]?.time };
}

export function recentRain(weather: WeatherSnapshot, date: string, today: string, clock: string): number {
  const daily = weather.daily.filter((day) => {
    const age = daysBetween(day.date, date);
    return age > 0 && age <= 2 && (day.date < today || (day.precipitationProbability ?? 0) >= 60);
  }).reduce((sum, day) => sum + day.precipitation, 0);
  const elapsed = date === today ? weather.hourly.filter((hour) =>
    hour.time.startsWith(today) && hour.time <= clock
  ).reduce((sum, hour) => sum + (hour.precipitation ?? 0), 0) : 0;
  return daily + elapsed;
}
