import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'sunrise',
  'sunset',
  'sunshine_duration',
  'wind_speed_10m_max',
].join(',');

function coordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const latitude = coordinate(query.get('latitude'));
  const longitude = coordinate(query.get('longitude'));
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ message: 'Valid latitude and longitude are required.' }, { status: 400 });
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day');
  url.searchParams.set('daily', DAILY);
  url.searchParams.set('hourly', 'precipitation,precipitation_probability');
  url.searchParams.set('past_days', '7');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('timezone', 'auto');

  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
    if (!response.ok) {
      return NextResponse.json({ message: 'The weather service did not return a forecast.' }, { status: 502 });
    }
    return NextResponse.json(await response.json(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ message: 'Unable to reach the weather service right now.' }, { status: 502 });
  }
}
