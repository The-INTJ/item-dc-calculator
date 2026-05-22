import { NextResponse } from 'next/server';

import { buildExportJson, buildExportText } from '@/plants/lib/format';
import { listPlants } from '@/plants/lib/server/plantsStore';

import { jsonError } from '../_lib/http';

export const dynamic = 'force-dynamic';

/**
 * Public, read-only export of the whole plant collection. Returns structured
 * JSON by default, or a Markdown digest with `?format=text` — handy for pasting
 * the data straight into an AI for analysis.
 */
export async function GET(request: Request) {
  const result = await listPlants();
  if (!result.success) {
    return jsonError(result.error ?? 'Failed to load plants', 500);
  }

  const plants = result.data ?? [];
  const now = Date.now();
  const format = new URL(request.url).searchParams.get('format');

  if (format === 'text' || format === 'markdown') {
    return new NextResponse(buildExportText(plants, now), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(buildExportJson(plants, now), {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
