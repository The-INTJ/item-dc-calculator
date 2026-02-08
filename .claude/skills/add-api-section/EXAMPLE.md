# Example: Adding a Judges API Section

This example shows how to add a complete Judges section following the Entries pattern.

## Step 1: Plan the Resource

- **Resource name**: `judges`
- **Base path**: `/contests/{id}/judges`
- **Operations**: All five (GET list, POST create, GET single, PATCH update, DELETE delete)
- **Parent**: Nested under contests
- **Data**: Judge ID, display name, role, contact info

## Step 2: Directory Structure

```
app/api/contest/contests/[id]/judges/
├── route.ts                    # Collection operations
└── [judgeId]/
    └── route.ts               # Single item operations
```

## Step 3: Collection Route

File: `app/api/contest/contests/[id]/judges/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.judges?.listByContest(contestId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: contestId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider?.judges?.create(contestId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
```

## Step 4: Item Route

File: `app/api/contest/contests/[id]/judges/[judgeId]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';

interface RouteParams {
  params: Promise<{ id: string; judgeId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestId, judgeId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.judges?.getById(contestId, judgeId);
  if (!result.success || !result.data) {
    return NextResponse.json({ message: result.error ?? 'Judge not found' }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: contestId, judgeId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider?.judges?.update(contestId, judgeId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: contestId, judgeId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.judges?.delete(contestId, judgeId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
```

## Step 5: TypeScript Types

Add to `contestTypes.ts`:

```typescript
export interface Judge {
  id: string;
  displayName: string;
  role: JudgeRole;
  contact?: string;
}

export interface JudgeRequest {
  displayName: string;
  role: JudgeRole;
  contact?: string;
}
```

## Step 6: OpenAPI Schema

Add to `components.schemas` in `openapi.json`:

```json
"Judge": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "example": "judge-1" },
    "displayName": { "type": "string", "example": "Jane Smith" },
    "role": { "$ref": "#/components/schemas/JudgeRole" },
    "contact": { "type": "string", "example": "jane@example.com" }
  },
  "required": ["id", "displayName", "role"]
}
```

## Step 7: OpenAPI Paths

Add to `paths` in `openapi.json`:

```json
"/contests/{id}/judges": {
  "parameters": [
    {
      "name": "id",
      "in": "path",
      "required": true,
      "description": "Contest ID",
      "schema": { "type": "string" }
    }
  ],
  "get": {
    "summary": "List judges for a contest",
    "description": "Returns all judges assigned to a contest.",
    "tags": ["Judges"],
    "responses": {
      "200": {
        "description": "List of judges",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": { "$ref": "#/components/schemas/Judge" }
            }
          }
        }
      },
      "404": {
        "description": "Contest not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  },
  "post": {
    "summary": "Add a judge to a contest",
    "description": "Creates a new judge assignment for the contest.",
    "tags": ["Judges"],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "displayName": { "type": "string" },
              "role": { "$ref": "#/components/schemas/JudgeRole" },
              "contact": { "type": "string" }
            },
            "required": ["displayName", "role"]
          },
          "example": {
            "displayName": "Jane Smith",
            "role": "judge",
            "contact": "jane@example.com"
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "Judge created",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Judge" }
          }
        }
      },
      "400": {
        "description": "Invalid request body",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
},
"/contests/{id}/judges/{judgeId}": {
  "parameters": [
    {
      "name": "id",
      "in": "path",
      "required": true,
      "description": "Contest ID",
      "schema": { "type": "string" }
    },
    {
      "name": "judgeId",
      "in": "path",
      "required": true,
      "description": "Judge ID",
      "schema": { "type": "string" }
    }
  ],
  "get": {
    "summary": "Get a judge",
    "description": "Returns a single judge by ID.",
    "tags": ["Judges"],
    "responses": {
      "200": {
        "description": "Judge details",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Judge" }
          }
        }
      },
      "404": {
        "description": "Judge not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  },
  "patch": {
    "summary": "Update a judge",
    "description": "Updates an existing judge.",
    "tags": ["Judges"],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "displayName": { "type": "string" },
              "role": { "$ref": "#/components/schemas/JudgeRole" },
              "contact": { "type": "string" }
            }
          },
          "example": {
            "role": "admin"
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Judge updated",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Judge" }
          }
        }
      },
      "404": {
        "description": "Judge not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  },
  "delete": {
    "summary": "Delete a judge",
    "description": "Removes a judge from the contest.",
    "tags": ["Judges"],
    "responses": {
      "200": {
        "description": "Judge deleted",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/SuccessResponse" }
          }
        }
      },
      "404": {
        "description": "Judge not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
}
```

## Step 8: Add Tag

Add to `tags` array in `openapi.json`:

```json
{ "name": "Judges", "description": "Manage judges and their roles in contests" }
```

## Step 9: Backend Provider

In your contest provider/context, add:

```typescript
judges: {
  listByContest: async (contestId: string) => {
    // Fetch all judges for contest
  },
  getById: async (contestId: string, judgeId: string) => {
    // Fetch single judge
  },
  create: async (contestId: string, data: JudgeRequest) => {
    // Create new judge
  },
  update: async (contestId: string, judgeId: string, data: Partial<JudgeRequest>) => {
    // Update judge
  },
  delete: async (contestId: string, judgeId: string) => {
    // Delete judge
  },
}
```

## Result

After following this example, you'll have a fully functional Judges API section with:
- ✅ Two route files with proper TypeScript
- ✅ Consistent error handling
- ✅ Complete OpenAPI documentation
- ✅ Backend provider integration
- ✅ Type safety throughout

The structure mirrors Entries exactly, making it maintainable and familiar to other developers.
