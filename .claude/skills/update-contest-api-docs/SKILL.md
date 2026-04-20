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
- The browser app talks to the API through `src/features/contest/lib/api/contestApi.ts` — every client call goes through REST.
- The only intentional Firestore client usage is `onSnapshot` for real-time contest subscriptions in `src/features/contest/lib/realtime/`.

## Where schemas live

Resource schemas (request bodies, response bodies, primitive enums) are zod schemas in:

- `src/features/contest/lib/schemas/index.ts`

That file is the source of truth for both TypeScript types (`z.infer<typeof X>`) and the OpenAPI `components.schemas` block. The build step (`npm run docs:build`) regenerates `components.schemas` from these definitions — never hand-edit that block.

Path operations (summary, description, parameters, responses) are still hand-written directly in `openapi.json`.

## Route files to analyze

Scan these route files for the current API implementation:

- `app/api/contest/current/route.ts` — `GET /current`
- `app/api/contest/contests/route.ts` — `GET/POST /contests`
- `app/api/contest/contests/[id]/route.ts` — `GET/PATCH/DELETE /contests/{id}`
- `app/api/contest/contests/[id]/entries/route.ts` — `GET/POST /contests/{id}/entries`
- `app/api/contest/contests/[id]/entries/[entryId]/route.ts` — `GET/PATCH/DELETE /contests/{id}/entries/{entryId}`
- `app/api/contest/contests/[id]/scores/route.ts` — `GET/POST /contests/{id}/scores`
- `app/api/contest/contests/[id]/register/route.ts` — `POST /contests/{id}/register`
- `app/api/contest/configs/route.ts` — `GET/POST /configs`
- `app/api/contest/configs/[configId]/route.ts` — `GET/PATCH/DELETE /configs/{configId}`
- `app/api/contest/auth/profile/route.ts` — `GET/PATCH /auth/profile`
- `app/api/contest/auth/register-profile/route.ts` — `POST /auth/register-profile`
- `app/api/contest/docs/route.ts` — serves the OpenAPI documentation

Read shared helpers too when auth or response behavior is unclear:

- `app/api/contest/_lib/http.ts` (includes `parseBody` which wraps zod validation)
- `app/api/contest/_lib/requireAdmin.ts`
- `app/api/contest/_lib/requireAuth.ts`
- `src/features/contest/lib/server/serverAuth.ts`
- `src/features/contest/lib/backend/serverProvider.ts`

## Update process

1. **Change the schema, not the JSON.** If you need a new request body shape or resource type, add/edit it in `src/features/contest/lib/schemas/index.ts`:
   - Define the zod schema with `.openapi('Name', { description: ..., example: ... })`.
   - Export the inferred TypeScript type (`export type X = z.infer<typeof XSchema>`).
   - Register it at the bottom of the file: `register('X', XSchema)`.
2. **Wire the schema into the route.** Replace any `readJsonBody<T>(request)` with `parseBody(request, XSchema)`. Import the schema from `@/contest/lib/schemas`.
3. **Update the path operation by hand** in `openapi.json` if the endpoint is new or the response/auth/description changed. Path operations are NOT generated — only `components.schemas` is.
4. **Regenerate and validate:** `npm run docs:validate` runs `docs:build` (generates `components.schemas` from zod) and then validates the spec.
5. **Verify the UI:** open `/api/contest/docs` — Scalar renders the updated spec.

## Schema guidelines

- Reuse existing zod schemas. Use `.extend`, `.omit`, `.pick`, `.partial` to derive request-body variants from the resource schema instead of duplicating fields.
- Use `.openapi('Name', {...})` to attach OpenAPI metadata and `register('Name', schema)` at the bottom of the file to make it appear in `components.schemas`.
- Include examples when they clarify a request or response.

## Consistency rules

- If a public `GET` route does not enforce admin access, do not document a `403` response.
- If a route returns `201` on create and `204` on delete, match those codes exactly (no `200` for those).
- If a route supports multiple success shapes, document that explicitly.
- Keep descriptions aligned with the actual code path, not past implementations.
- Admin-only mutation endpoints require `security: [{ FirebaseBearer: [] }]`. So do endpoints that use `requireAuth` (score submission, register, auth/profile).

## Validation checklist

After updating, verify:

- All exported route handlers have corresponding path operations in `openapi.json`.
- Every request body in a route uses `parseBody(..., SomeSchema)` and references a registered schema.
- Response status codes match the implementation (204 for delete, 201 for create).
- Auth requirements match `requireAdmin` / `requireAuth` guards.
- `npm run docs:validate` passes (this also regenerates `components.schemas`).
