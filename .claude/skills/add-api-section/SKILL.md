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
- **CRUD operations**: GET (list), POST (create), GET (single), PATCH (update), DELETE (delete)
- **Type definitions**: TypeScript interfaces for request bodies
- **Error handling**: Consistent error responses (400, 403, 404, 500)
- **OpenAPI documentation**: Full endpoint definitions with schemas

## Step 1: Plan Your Resource

Define what you're adding:
- **Resource name** (singular): `judges`, `rounds`, `results`, etc.
- **Base path**: `/contests/{id}/[resource]`
- **Operations**: Which CRUD operations does this need? (Entries has all five)
- **Parent resource**: Is it nested under a contest? Under an entry? At the root?
- **Data schema**: What properties does your resource have?

## Step 2: Create Directory Structure

Create the nested route files following Entries pattern:

```
app/api/contest/contests/[id]/[resource]/
├── route.ts                      # GET (list), POST (create)
└── [resourceId]/
    └── route.ts                  # GET (single), PATCH (update), DELETE (delete)
```

Example for `judges`:
- `app/api/contest/contests/[id]/judges/route.ts`
- `app/api/contest/contests/[id]/judges/[judgeId]/route.ts`

## Step 3: Implement Route Files

### Pattern: Collection Route (`route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List all [resource] for a contest
export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.[resource]?.listByContest(contestId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

// POST: Create a new [resource]
export async function POST(request: Request, { params }: RouteParams) {
  const { id: contestId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider?.[resource]?.create(contestId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
```

### Pattern: Item Route (`[resourceId]/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';

interface RouteParams {
  params: Promise<{ id: string; resourceId: string }>;
}

// GET: Fetch a single [resource]
export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestId, resourceId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.[resource]?.getById(contestId, resourceId);
  if (!result.success || !result.data) {
    return NextResponse.json({ message: result.error ?? '[Resource] not found' }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

// PATCH: Update a [resource]
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: contestId, resourceId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider?.[resource]?.update(contestId, resourceId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE: Remove a [resource]
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: contestId, resourceId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.[resource]?.delete(contestId, resourceId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
```

## Step 4: Define TypeScript Types

In `contestTypes.ts`, add an interface matching your route body:

```typescript
export interface [ResourceRequest] {
  [field1]: string;
  [field2]: string;
  // ... other properties
}

export interface [Resource] extends [ResourceRequest] {
  id: string;
  // ... auto-generated fields
}
```

Example from Entries:
```typescript
export interface Entry {
  id: string;
  name: string;
  slug: string;
  description: string;
  round: string;
  submittedBy: string;
  // ... additional fields
}
```

## Step 5: Implement Backend Provider Methods

In the backend provider (typically in contest context), add these methods:

```typescript
[resource]: {
  listByContest: async (contestId: string) => Promise<Result<[Resource][]>>,
  getById: async (contestId: string, resourceId: string) => Promise<Result<[Resource]>>,
  create: async (contestId: string, data: [ResourceRequest]) => Promise<Result<[Resource]>>,
  update: async (contestId: string, resourceId: string, data: Partial<[ResourceRequest]>) => Promise<Result<[Resource]>>,
  delete: async (contestId: string, resourceId: string) => Promise<Result<{ success: boolean }>>,
}
```

## Step 6: Update OpenAPI Documentation

Add these sections to `app/api/contest/openapi.json`:

1. **Add a schema** in `components.schemas`:
```json
"[Resource]": {
  "type": "object",
  "description": "Description of your resource",
  "properties": {
    "id": { "type": "string", "example": "judge-1" },
    "name": { "type": "string", "example": "Jane Doe" }
    // ... other properties
  },
  "required": ["id", "name"]
}
```

2. **Add path operations** in `paths`:
```json
"/contests/{id}/[resource]": {
  "get": { ... },
  "post": { ... }
},
"/contests/{id}/[resource]/{resourceId}": {
  "get": { ... },
  "patch": { ... },
  "delete": { ... }
}
```

3. **Add a tag** in `tags` array:
```json
{ "name": "[Resource]", "description": "Manage [resource] for contests" }
```

Use the [Entries section](../../openapi.json#/paths/~1contests~1{id}~1entries) as a template for request/response structures.

## Step 7: Consistency Checklist

Verify your implementation follows Entries standards:

- [ ] Directory structure matches: `contests/[id]/[resource]/route.ts` and `[resourceId]/route.ts`
- [ ] Both route files export GET, POST (collection) and GET, PATCH, DELETE (item)
- [ ] Route handlers accept `Request` and `RouteParams` with proper typing
- [ ] Error handling returns consistent status codes (400, 404, 500)
- [ ] Backend provider has all five methods defined
- [ ] Request body validated with TypeScript interfaces
- [ ] All endpoints documented in OpenAPI spec with schemas
- [ ] Tag added to OpenAPI and used in all endpoint definitions
- [ ] Resource name used consistently (singular in URLs, consistent in code)
- [ ] Response examples provided in OpenAPI POST/PATCH definitions

## Step 8: Use the Update API Skill

After adding routes and types, run `/update-contest-api-docs` to ensure OpenAPI docs stay synchronized.

## Common Variations

### Root-level resource (not nested under contest)
```
/api/contest/[resource]/route.ts
/api/contest/[resource]/[resourceId]/route.ts
```

### Nested deeper than two levels
```
/contests/{id}/[parent]/[parentId]/[resource]/route.ts
```

### Read-only resource
Implement only GET operations; skip POST, PATCH, DELETE.

### Single item (not a collection)
Implement only GET and PATCH; skip list operations.
