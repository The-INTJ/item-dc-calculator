/**
 * Mock server adapter that routes fetch requests directly to Next.js API handlers.
 * This allows tests to run without a real server.
 */

// Import API route handlers
import * as contestsRoute from '../../../app/api/contest/contests/route';
import * as contestByIdRoute from '../../../app/api/contest/contests/[id]/route';
import * as entriesRoute from '../../../app/api/contest/contests/[id]/entries/route';
import * as entryByIdRoute from '../../../app/api/contest/contests/[id]/entries/[entryId]/route';
import * as scoresRoute from '../../../app/api/contest/contests/[id]/scores/route';
import * as configsRoute from '../../../app/api/contest/configs/route';
import * as configByIdRoute from '../../../app/api/contest/configs/[configId]/route';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RouteHandler {
  GET?: (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>;
  POST?: (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>;
  PATCH?: (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>;
  DELETE?: (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>;
}

interface RouteMatch {
  handler: RouteHandler;
  params: Record<string, string>;
}

// Route definitions matching Next.js app router patterns
const routes: Array<{
  pattern: RegExp;
  handler: RouteHandler;
  paramNames: string[];
}> = [
  // /api/contest/configs/:configId
  {
    pattern: /^\/api\/contest\/configs\/([^/]+)$/,
    handler: configByIdRoute as RouteHandler,
    paramNames: ['configId'],
  },
  // /api/contest/configs
  {
    pattern: /^\/api\/contest\/configs$/,
    handler: configsRoute as RouteHandler,
    paramNames: [],
  },
  // /api/contest/contests/:id/entries/:entryId
  {
    pattern: /^\/api\/contest\/contests\/([^/]+)\/entries\/([^/]+)$/,
    handler: entryByIdRoute as RouteHandler,
    paramNames: ['id', 'entryId'],
  },
  // /api/contest/contests/:id/entries
  {
    pattern: /^\/api\/contest\/contests\/([^/]+)\/entries$/,
    handler: entriesRoute as RouteHandler,
    paramNames: ['id'],
  },
  // /api/contest/contests/:id/scores
  {
    pattern: /^\/api\/contest\/contests\/([^/]+)\/scores$/,
    handler: scoresRoute as RouteHandler,
    paramNames: ['id'],
  },
  // /api/contest/contests/:id
  {
    pattern: /^\/api\/contest\/contests\/([^/]+)$/,
    handler: contestByIdRoute as RouteHandler,
    paramNames: ['id'],
  },
  // /api/contest/contests
  {
    pattern: /^\/api\/contest\/contests$/,
    handler: contestsRoute as RouteHandler,
    paramNames: [],
  },
];

/**
 * Matches a URL path to a route handler and extracts parameters.
 */
function matchRoute(pathname: string): RouteMatch | null {
  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });
      return { handler: route.handler, params };
    }
  }
  return null;
}

/**
 * Mock fetch function that routes requests to Next.js API handlers.
 */
export async function mockFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? new URL(input) : input instanceof URL ? input : new URL(input.url);
  const method = (init?.method || 'GET').toUpperCase() as HttpMethod;

  // Only intercept requests to our API
  if (!url.pathname.startsWith('/api/contest')) {
    // Fall back to original fetch for other requests
    return globalThis.fetch(input, init);
  }

  const routeMatch = matchRoute(url.pathname);
  if (!routeMatch) {
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { handler, params } = routeMatch;
  const handlerFn = handler[method];

  if (!handlerFn) {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create a proper Request object
  const request = new Request(url.toString(), {
    method,
    headers: init?.headers,
    body: init?.body,
  });

  // Create the context with params as a Promise (Next.js 15+ style)
  const context = Object.keys(params).length > 0
    ? { params: Promise.resolve(params) }
    : undefined;

  try {
    const response = await handlerFn(request, context);
    return response;
  } catch (error) {
    console.error('[mockFetch] Handler error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Sets up the mock server by replacing global fetch.
 */
export function setupMockServer(): void {
  globalThis.fetch = mockFetch as typeof fetch;
}

/**
 * Restores the original fetch function.
 */
let originalFetch: typeof fetch | null = null;

export function enableMockServer(): void {
  if (!originalFetch) {
    originalFetch = globalThis.fetch;
  }
  globalThis.fetch = mockFetch as typeof fetch;
}

export function disableMockServer(): void {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
}
