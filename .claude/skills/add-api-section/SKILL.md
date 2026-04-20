---
name: add-api-section
description: Add a new API section to /api/contest following the Entries structure pattern. Use when implementing a new resource type (judges, configs, etc).
argument-hint: "[resource-name]"
---

# Adding a New API Section to /api/contest

This skill guides you through adding a complete, documented API section following the **Entries section** as the gold standard for structure and conventions.

## Quick Start

- See **EXAMPLE.md** for a Judges section walkthrough
- See **CONTESTCONFIGS.md** for the ContestConfigs implementation guide

## Gold Standard: Entries Section

The Entries section is the reference implementation. It includes:

- **File structure**: `app/api/contest/[resource]/route.ts` files
- **Zod-first schemas**: Request bodies validated with zod, types inferred from the same definition
- **CRUD operations**: GET (list), POST (create), GET (single), PATCH (update), DELETE (delete)
- **Error handling**: `jsonError`, `fromProviderResult`, `parseBody` helpers
- **OpenAPI documentation**: `components.schemas` generated from zod; path operations hand-written

## Step 1: Plan Your Resource

Define what you're adding:

- **Resource name** (singular): `judges`, `rounds`, `results`, etc.
- **Base path**: `/contests/{id}/[resource]`
- **Operations**: Which CRUD operations does this need? (Entries has all five)
- **Parent resource**: Is it nested under a contest? Under an entry? At the root?
- **Data schema**: What properties does your resource have?

## Step 2: Add zod schemas

Edit `src/features/contest/lib/schemas/index.ts`:

```ts
export const ResourceSchema = z
  .object({
    id: z.string().openapi({ example: 'resource-1' }),
    name: z.string().openapi({ example: 'Something' }),
    // ...
  })
  .openapi('Resource');

export const CreateResourceBodySchema = ResourceSchema.omit({ id: true }).openapi('CreateResourceBody');
export const UpdateResourceBodySchema = ResourceSchema.partial()
  .omit({ id: true })
  .openapi('UpdateResourceBody');

export type Resource = z.infer<typeof ResourceSchema>;
export type CreateResourceBody = z.infer<typeof CreateResourceBodySchema>;
export type UpdateResourceBody = z.infer<typeof UpdateResourceBodySchema>;
```

At the bottom of the file, register each schema so it ends up in the generated spec:

```ts
register('Resource', ResourceSchema);
register('CreateResourceBody', CreateResourceBodySchema);
register('UpdateResourceBody', UpdateResourceBodySchema);
```

## Step 3: Create directory structure

```
app/api/contest/contests/[id]/[resource]/
├── route.ts                      # GET (list), POST (create)
└── [resourceId]/
    └── route.ts                  # GET (single), PATCH (update), DELETE (delete)
```

## Step 4: Implement route files

### Collection route (`route.ts`)

```ts
import { NextResponse } from 'next/server';
import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../_lib/requireAdmin';
import { CreateResourceBodySchema } from '@/contest/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestParam } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) return jsonError(error ?? 'Contest not found', 404);

  const result = await provider.resources.listByContest(contest.id);
  if (!result.success) return jsonError(result.error ?? 'Resources not found', 404);
  return jsonSuccess(result.data ?? []);
}

export async function POST(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { id: contestParam } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) return jsonError(error ?? 'Contest not found', 404);

  const body = await parseBody(request, CreateResourceBodySchema);
  if (!body.ok) return body.response;

  const result = await provider.resources.create(contest.id, body.data);
  return fromProviderResult(result, { failureStatus: 400, successStatus: 201 });
}
```

### Item route (`[resourceId]/route.ts`)

```ts
import { NextResponse } from 'next/server';
import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import { UpdateResourceBodySchema } from '@/contest/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string; resourceId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestParam, resourceId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) return jsonError(error ?? 'Contest not found', 404);

  const result = await provider.resources.getById(contest.id, resourceId);
  if (!result.success || !result.data) return jsonError(result.error ?? 'Resource not found', 404);
  return jsonSuccess(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { id: contestParam, resourceId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) return jsonError(error ?? 'Contest not found', 404);

  const body = await parseBody(request, UpdateResourceBodySchema);
  if (!body.ok) return body.response;

  const result = await provider.resources.update(contest.id, resourceId, body.data);
  return fromProviderResult(result, { failureStatus: 404 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { id: contestParam, resourceId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) return jsonError(error ?? 'Contest not found', 404);

  const result = await provider.resources.delete(contest.id, resourceId);
  if (!result.success) return jsonError(result.error ?? 'Resource not found', 404);
  return new NextResponse(null, { status: 204 });
}
```

Notes on the pattern:

- Use `parseBody(request, Schema)` — never hand-write JSON parsing or body validation.
- `fromProviderResult` for pass-through of provider results; `jsonError` for explicit errors.
- DELETE returns 204 No Content with an empty body.
- POST returns 201 Created with the new resource.
- Admin-only mutations call `requireAdmin`; authenticated mutations call `requireAuth`.

## Step 5: Backend provider

Add a new sub-provider interface to `src/features/contest/lib/backend/types.ts`:

```ts
export interface ResourcesProvider {
  listByContest(contestId: string): Promise<ProviderResult<Resource[]>>;
  getById(contestId: string, resourceId: string): Promise<ProviderResult<Resource | null>>;
  create(contestId: string, data: CreateResourceBody): Promise<ProviderResult<Resource>>;
  update(contestId: string, resourceId: string, updates: Partial<Resource>): Promise<ProviderResult<Resource>>;
  delete(contestId: string, resourceId: string): Promise<ProviderResult<void>>;
}
```

Add it to `BackendProvider`, implement in `src/features/contest/lib/firebase/providers/resourcesProvider.ts`, and wire into `firebaseBackendProvider.ts`.

## Step 6: OpenAPI documentation

Path operations are hand-written in `app/api/contest/openapi.json`. Add:

```json
"/contests/{id}/[resource]": {
  "get": { "tags": ["Resource"], "summary": "List ...", "responses": { ... } },
  "post": { "tags": ["Resource"], "security": [{ "FirebaseBearer": [] }], "requestBody": { "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CreateResourceBody" } } } }, "responses": { "201": { ... } } }
},
"/contests/{id}/[resource]/{resourceId}": {
  "get": { ... },
  "patch": { ... },
  "delete": { "responses": { "204": { "description": "Resource deleted" } } }
}
```

Reference the registered schemas via `$ref`. Do NOT hand-edit `components.schemas` — it's regenerated by `npm run docs:build` from the zod registry.

Add a tag to the `tags` array at the bottom.

## Step 7: Client wrapper

Add methods to `src/features/contest/lib/api/contestApi.ts` that return `ProviderResult<T>`:

```ts
async listResources(contestId: string): Promise<ProviderResult<Resource[]>> {
  return fetchProviderResult<Resource[]>(`${API}/contests/${encodeURIComponent(contestId)}/[resource]`);
},

async createResource(contestId: string, data: CreateResourceBody): Promise<ProviderResult<Resource>> {
  return fetchProviderResult<Resource>(`${API}/contests/${encodeURIComponent(contestId)}/[resource]`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
},
// ...
```

## Step 8: Validate

- `npm run type-check`
- `npm run lint`
- `npm test` (add a route test using the `vi.mock('@/contest/lib/backend/serverProvider')` pattern)
- `npm run docs:validate` — regenerates `components.schemas` then validates the spec

## Consistency checklist

- [ ] Zod schemas defined, registered, and TS types inferred via `z.infer`
- [ ] Routes use `parseBody` (not `readJsonBody`) for validation
- [ ] Admin endpoints call `requireAdmin`, authenticated endpoints call `requireAuth`
- [ ] DELETE returns `204 No Content`, POST returns `201 Created`
- [ ] `components.schemas` only contains generated entries (not hand-edited)
- [ ] Path operations hand-written in `openapi.json` with correct auth, status codes, and `$ref` to zod schemas
- [ ] Client wrapper returns `ProviderResult<T>` (no silent null returns)
- [ ] Tag added to OpenAPI `tags` array

## Common variations

### Root-level resource (not nested under contest)

```
app/api/contest/[resource]/route.ts
app/api/contest/[resource]/[resourceId]/route.ts
```

### Read-only resource

Implement only GET operations; skip POST, PATCH, DELETE. Do not include `security` in the path operation.

### Single item (not a collection)

Implement only GET and PATCH; skip list operations.
