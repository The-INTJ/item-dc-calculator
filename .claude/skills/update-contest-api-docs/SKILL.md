---
name: update-contest-api-docs
description: Update the OpenAPI documentation for /api/contest endpoints. Use when API routes change, new endpoints are added, or request/response schemas are modified.
---

# Update Contest API OpenAPI Documentation

Keep `app/api/contest/openapi.json` synchronized with the actual `/api/contest` route-handler implementation.

## Scope

This skill is scoped only to `/api/contest` endpoints. Do not document other API routes.

Important boundary:

- `openapi.json` documents the HTTP route-handler surface.
- It does not define the browser app's primary runtime data path.
- The browser app may still use the Firebase-backed client path directly.

## Route Files To Analyze

Scan these route files for the current API implementation:

- `app/api/contest/current/route.ts` - `GET /current`
- `app/api/contest/contests/route.ts` - `GET/POST /contests`
- `app/api/contest/contests/[id]/route.ts` - `GET/PATCH/DELETE /contests/{id}`
- `app/api/contest/contests/[id]/entries/route.ts` - `GET/POST /contests/{id}/entries`
- `app/api/contest/contests/[id]/entries/[entryId]/route.ts` - `GET/PATCH/DELETE /contests/{id}/entries/{entryId}`
- `app/api/contest/contests/[id]/scores/route.ts` - `GET/POST /contests/{id}/scores`
- `app/api/contest/configs/route.ts` - `GET/POST /configs`
- `app/api/contest/configs/[configId]/route.ts` - `GET/PATCH/DELETE /configs/{configId}`
- `app/api/contest/docs/route.ts` - serves the OpenAPI documentation

Read shared helpers too when auth or response behavior is unclear:

- `app/api/contest/_lib/http.ts`
- `app/api/contest/_lib/provider.ts`
- `app/api/contest/_lib/requireAdmin.ts`
- `src/features/contest/lib/api/serverAuth.ts`

## Update Process

1. Read the current spec at `app/api/contest/openapi.json`.
2. Analyze each route file to extract:
   - exported HTTP methods
   - request body schemas from TypeScript interfaces and validation
   - query parameters from `url.searchParams`
   - path parameters from `params`
   - response schemas and status codes
   - auth requirements, especially `requireAdmin`
3. Compare the spec against the actual implementation.
4. Update the spec to reflect:
   - new endpoints
   - changed request or response schemas
   - new or modified query parameters
   - correct status codes
   - current auth requirements
5. Validate the finished spec with `npm run docs:validate`.

## OpenAPI Structure

The spec uses OpenAPI 3.1.0 with:

- server base URL: `/api/contest`
- tags for contest API areas
- reusable schemas in `components/schemas`
- `FirebaseBearer` for admin-only HTTP endpoints

Auth note:

- The public contract should describe the real supported auth story.
- For admin endpoints, document Firebase bearer auth.
- Same-origin cookie-based auth can be mentioned in descriptions when helpful.
- Do not present dev-only fallbacks as the primary public contract.

## Schema Guidelines

- Reuse existing schemas from `components/schemas` when possible.
- Add new schemas only when a route introduces a real new payload shape.
- Use `$ref` for schema references.
- Include examples when they clarify a request or response.
- Remove stale schemas and fields when routes no longer support them.

## Consistency Rules

- If a public `GET` route does not enforce admin access, do not document a `403` response.
- If a route always returns `200` on success, do not document `201`.
- If a route supports multiple success shapes, document that explicitly.
- Keep descriptions aligned with the actual code path, not past implementations.
- Treat `openapi.json` as maintained source, not a generated artifact.

## Validation Checklist

After updating, verify:

- all exported route handlers have corresponding path operations
- request body schemas match the current TypeScript interfaces and validation
- response status codes match the implementation
- query and path parameters are documented with correct types
- auth requirements match `requireAdmin` and current server auth behavior
- removed features are no longer described in the spec
- `npm run docs:validate` passes
