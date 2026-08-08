/**
 * Flexible admin paths for the donut rotation.
 *
 * Any URL ending in `/admin` with at least one segment in front of it serves
 * the donut admin view — `/donuts/admin`, `/Dan/admin`, `/whatever/you/admin`.
 * The group wanted an unlisted path they could pick themselves rather than a
 * login, so this rewrites instead of redirecting: the address bar keeps
 * whatever they typed.
 *
 * A rewrite is used rather than a route file because Next.js does not allow a
 * static segment (`admin`) to follow a catch-all segment.
 *
 * The contest app's own single-segment `/admin` is untouched — the matcher
 * requires a prefix segment, so `/admin` never reaches this function.
 */

import { NextResponse, type NextRequest } from 'next/server';

const DONUTS_ADMIN = '/donuts/admin';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === DONUTS_ADMIN) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = DONUTS_ADMIN;
  return NextResponse.rewrite(url);
}

export const config = {
  // One or more segments, then `/admin`. API and framework paths are excluded.
  matcher: ['/((?!api/|_next/).*)/admin'],
};
