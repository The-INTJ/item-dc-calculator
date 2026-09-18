import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ locations: [] });
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ locations: [] }, { status: 502 });
    const data = await response.json() as { results?: Record<string, unknown>[] };
    const locations = (data.results ?? []).map((result) => ({
      id: typeof result.id === 'number' ? result.id : undefined,
      name: String(result.name ?? 'Unknown place'),
      admin1: typeof result.admin1 === 'string' ? result.admin1 : undefined,
      country: typeof result.country === 'string' ? result.country : undefined,
      countryCode: typeof result.country_code === 'string' ? result.country_code : undefined,
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      timezone: typeof result.timezone === 'string' ? result.timezone : undefined,
    }));
    return NextResponse.json({ locations }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ locations: [] }, { status: 502 });
  }
}
