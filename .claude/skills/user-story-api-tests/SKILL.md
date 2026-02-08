---
name: user-story-api-tests
description: Create and run JSON-driven API tests that validate User Stories by executing actions and verifying end-state. Supply input/output objects to test complete workflows.
argument-hint: "[test-file.json]"
---

# User Story API Testing Framework

This skill guides you through creating and running JSON-driven API tests that validate User Stories from `UserStories.md`. Each test defines inputs (API parameters) and expected outputs (end-state validation).

## Quick Start

1. See **SCHEMA.md** for the complete JSON test file schema
2. See **EXAMPLES.md** for sample test files for each user story
3. See **IN-MEMORY-PROVIDER.md** for running tests against a mock datastore (recommended)
4. Create your test file following the schema
5. Run tests with `npm run test:stories` or `npx vitest run src/tests/stories/`

## Architecture Overview

```
src/tests/
├── stories/                      # User story test files
│   ├── runner.ts                 # Test runner engine
│   ├── helpers.ts                # API client & assertion helpers
│   ├── fixtures/                 # Reusable test data
│   │   ├── contests.json
│   │   ├── entries.json
│   │   └── configs.json
│   └── specs/                    # JSON test specifications
│       ├── 01-create-contest.spec.json
│       ├── 02-participate.spec.json
│       ├── 03-custom-config.spec.json
│       ├── 04-edit-entry.spec.json
│       ├── 05-edit-rounds.spec.json
│       ├── 06-edit-score.spec.json
│       ├── 07-delete-entry.spec.json
│       └── 08-delete-contest.spec.json
└── setup.ts                      # Global test setup
```

## JSON Test File Schema

Each test file follows this structure:

```json
{
  "story": "As a user, I want to [goal]",
  "description": "Brief description of what this test validates",
  "baseUrl": "http://localhost:3000/api/contest",
  "setup": {
    "description": "Pre-test setup steps",
    "actions": [
      {
        "id": "setup-contest",
        "method": "POST",
        "endpoint": "/contests",
        "input": { "name": "Test Contest", "slug": "test-contest", "configTemplate": "mixology" },
        "storeAs": "contest"
      }
    ]
  },
  "actions": [
    {
      "id": "action-1",
      "description": "Human-readable description of the action",
      "method": "POST | GET | PATCH | DELETE",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Test Entry",
        "slug": "test-entry",
        "description": "A test entry",
        "round": "finals",
        "submittedBy": "Test User"
      },
      "output": {
        "status": 201,
        "body": {
          "name": "Test Entry",
          "slug": "test-entry"
        }
      },
      "storeAs": "entry"
    }
  ],
  "validate": {
    "description": "End-state validation after all actions complete",
    "checks": [
      {
        "id": "verify-entry-exists",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "output": {
          "status": 200,
          "bodyContains": {
            "path": "[0].name",
            "value": "Test Entry"
          }
        }
      }
    ]
  },
  "teardown": {
    "description": "Cleanup after test",
    "actions": [
      {
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}"
      }
    ]
  }
}
```

## Schema Field Reference

### Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `story` | string | Yes | The user story being tested (from UserStories.md) |
| `description` | string | Yes | Brief description of what this test validates |
| `baseUrl` | string | Yes | Base URL for API calls (default: `http://localhost:3000/api/contest`) |
| `setup` | object | No | Pre-test setup actions |
| `actions` | array | Yes | Main test actions to execute |
| `validate` | object | No | End-state validation checks |
| `teardown` | object | No | Cleanup actions after test |

### Action Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this action |
| `description` | string | No | Human-readable description |
| `method` | string | Yes | HTTP method: `GET`, `POST`, `PATCH`, `DELETE` |
| `endpoint` | string | Yes | API endpoint (supports `{{variable}}` interpolation) |
| `input` | object | No | Request body for POST/PATCH requests |
| `headers` | object | No | Additional request headers |
| `output` | object | No | Expected response validation |
| `storeAs` | string | No | Store response in variable for later use |
| `delay` | number | No | Milliseconds to wait before executing |

### Output Object (Response Validation)

| Field | Type | Description |
|-------|------|-------------|
| `status` | number | Expected HTTP status code |
| `body` | object | Exact match for response body fields |
| `bodyContains` | object | Partial match with JSONPath support |
| `bodyNotContains` | object | Ensure value is NOT present |
| `headers` | object | Expected response headers |

### Variable Interpolation

Use `{{variable.path}}` syntax to reference stored values:

```json
{
  "actions": [
    {
      "id": "create-contest",
      "method": "POST",
      "endpoint": "/contests",
      "input": { "name": "Test", "slug": "test", "configTemplate": "mixology" },
      "storeAs": "contest"
    },
    {
      "id": "add-entry",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Entry 1",
        "slug": "entry-1",
        "description": "Test entry",
        "round": "finals",
        "submittedBy": "Tester"
      },
      "storeAs": "entry"
    },
    {
      "id": "verify-entry",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entry.id}}"
    }
  ]
}
```

## Implementation Steps

### Step 1: Create Test Infrastructure

Create the test runner and helper files:

**`src/tests/stories/helpers.ts`**
```typescript
export interface TestAction {
  id: string;
  description?: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  input?: Record<string, unknown>;
  headers?: Record<string, string>;
  output?: {
    status?: number;
    body?: Record<string, unknown>;
    bodyContains?: { path: string; value: unknown };
    bodyNotContains?: { path: string; value: unknown };
  };
  storeAs?: string;
  delay?: number;
}

export interface TestSpec {
  story: string;
  description: string;
  baseUrl: string;
  setup?: { actions: TestAction[] };
  actions: TestAction[];
  validate?: { checks: TestAction[] };
  teardown?: { actions: TestAction[] };
}

export class ApiTestClient {
  private baseUrl: string;
  private variables: Record<string, unknown> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  interpolate(text: string): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const value = this.getNestedValue(path);
      return String(value ?? '');
    });
  }

  private getNestedValue(path: string): unknown {
    const parts = path.split('.');
    let value: unknown = this.variables;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return value;
  }

  store(key: string, value: unknown): void {
    this.variables[key] = value;
  }

  async execute(action: TestAction): Promise<{
    status: number;
    body: unknown;
    headers: Headers;
  }> {
    if (action.delay) {
      await new Promise(resolve => setTimeout(resolve, action.delay));
    }

    const endpoint = this.interpolate(action.endpoint);
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        ...action.headers,
      },
    };

    if (action.input && ['POST', 'PATCH'].includes(action.method)) {
      options.body = JSON.stringify(action.input);
    }

    const response = await fetch(url, options);
    const body = await response.json().catch(() => null);

    if (action.storeAs && body) {
      this.store(action.storeAs, body);
    }

    return { status: response.status, body, headers: response.headers };
  }
}

export function validateResponse(
  action: TestAction,
  response: { status: number; body: unknown }
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (action.output?.status && response.status !== action.output.status) {
    errors.push(`Expected status ${action.output.status}, got ${response.status}`);
  }

  if (action.output?.body) {
    for (const [key, expected] of Object.entries(action.output.body)) {
      const actual = (response.body as Record<string, unknown>)?.[key];
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        errors.push(`Expected ${key} = ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    }
  }

  if (action.output?.bodyContains) {
    const { path, value } = action.output.bodyContains;
    const actual = getValueByPath(response.body, path);
    if (JSON.stringify(actual) !== JSON.stringify(value)) {
      errors.push(`Expected path "${path}" to contain ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`);
    }
  }

  if (action.output?.bodyNotContains) {
    const { path, value } = action.output.bodyNotContains;
    const actual = getValueByPath(response.body, path);
    if (JSON.stringify(actual) === JSON.stringify(value)) {
      errors.push(`Expected path "${path}" NOT to contain ${JSON.stringify(value)}`);
    }
  }

  return { passed: errors.length === 0, errors };
}

function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let value = obj;
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return value;
}
```

**`src/tests/stories/runner.ts`**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiTestClient, TestSpec, TestAction, validateResponse } from './helpers';

export function runStoryTest(spec: TestSpec) {
  describe(spec.story, () => {
    const client = new ApiTestClient(spec.baseUrl);

    async function executeActions(actions: TestAction[], phase: string) {
      for (const action of actions) {
        const response = await client.execute(action);

        if (action.output) {
          const validation = validateResponse(action, response);
          if (!validation.passed) {
            throw new Error(
              `[${phase}] Action "${action.id}" failed:\n${validation.errors.join('\n')}`
            );
          }
        }
      }
    }

    beforeAll(async () => {
      if (spec.setup?.actions) {
        await executeActions(spec.setup.actions, 'setup');
      }
    });

    afterAll(async () => {
      if (spec.teardown?.actions) {
        try {
          await executeActions(spec.teardown.actions, 'teardown');
        } catch {
          // Ignore teardown errors
        }
      }
    });

    it(spec.description, async () => {
      // Execute main actions
      for (const action of spec.actions) {
        const response = await client.execute(action);

        if (action.output) {
          const validation = validateResponse(action, response);
          expect(validation.passed, validation.errors.join('\n')).toBe(true);
        }
      }

      // Execute validation checks
      if (spec.validate?.checks) {
        for (const check of spec.validate.checks) {
          const response = await client.execute(check);
          const validation = validateResponse(check, response);
          expect(validation.passed, validation.errors.join('\n')).toBe(true);
        }
      }
    });
  });
}
```

### Step 2: Create Test Spec Files

Create JSON test files for each user story. Example for "Create Contest":

**`src/tests/stories/specs/01-create-contest.spec.json`**
```json
{
  "story": "As a user, I want to facilitate contest creation",
  "description": "Create a contest with entries and a config template",
  "baseUrl": "http://localhost:3000/api/contest",
  "actions": [
    {
      "id": "create-contest",
      "description": "Create a new contest with mixology template",
      "method": "POST",
      "endpoint": "/contests",
      "input": {
        "name": "Summer Mixology Championship 2024",
        "slug": "test-summer-mix-2024",
        "configTemplate": "mixology",
        "location": "Downtown Convention Center"
      },
      "output": {
        "status": 201,
        "body": {
          "name": "Summer Mixology Championship 2024",
          "slug": "test-summer-mix-2024"
        }
      },
      "storeAs": "contest"
    },
    {
      "id": "add-entry-1",
      "description": "Add first entry to the contest",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Midnight Mojito",
        "slug": "midnight-mojito",
        "description": "A dark twist on the classic mojito",
        "round": "semifinals",
        "submittedBy": "Jane Smith"
      },
      "output": {
        "status": 201,
        "body": {
          "name": "Midnight Mojito"
        }
      },
      "storeAs": "entry1"
    },
    {
      "id": "add-entry-2",
      "description": "Add second entry to the contest",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Sunset Sangria",
        "slug": "sunset-sangria",
        "description": "Refreshing wine-based cocktail",
        "round": "semifinals",
        "submittedBy": "John Doe"
      },
      "output": {
        "status": 201
      },
      "storeAs": "entry2"
    }
  ],
  "validate": {
    "description": "Verify contest and entries were created correctly",
    "checks": [
      {
        "id": "verify-contest-exists",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}",
        "output": {
          "status": 200,
          "body": {
            "name": "Summer Mixology Championship 2024"
          }
        }
      },
      {
        "id": "verify-entries-count",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "output": {
          "status": 200
        }
      }
    ]
  },
  "teardown": {
    "description": "Clean up test data",
    "actions": [
      {
        "id": "delete-contest",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}"
      }
    ]
  }
}
```

### Step 3: Create Test Entry Points

**`src/tests/stories/index.test.ts`**
```typescript
import { runStoryTest } from './runner';

// Import all spec files
import createContestSpec from './specs/01-create-contest.spec.json';
import participateSpec from './specs/02-participate.spec.json';
import customConfigSpec from './specs/03-custom-config.spec.json';
import editEntrySpec from './specs/04-edit-entry.spec.json';
import editRoundsSpec from './specs/05-edit-rounds.spec.json';
import editScoreSpec from './specs/06-edit-score.spec.json';
import deleteEntrySpec from './specs/07-delete-entry.spec.json';
import deleteContestSpec from './specs/08-delete-contest.spec.json';

// Run all story tests
runStoryTest(createContestSpec);
runStoryTest(participateSpec);
runStoryTest(customConfigSpec);
runStoryTest(editEntrySpec);
runStoryTest(editRoundsSpec);
runStoryTest(editScoreSpec);
runStoryTest(deleteEntrySpec);
runStoryTest(deleteContestSpec);
```

### Step 4: Update Vitest Config

Update `vitest.config.ts` to include the new test directory:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/tests/stories/**/*.test.ts'
    ],
    testTimeout: 30000, // API tests may need longer timeout
  },
});
```

### Step 5: Add NPM Script

Add a dedicated script for running story tests in `package.json`:

```json
{
  "scripts": {
    "test:stories": "vitest run src/tests/stories/",
    "test:stories:watch": "vitest src/tests/stories/"
  }
}
```

## User Story Test Coverage

Map each user story to its test file:

| User Story | Test File | Key Actions |
|------------|-----------|-------------|
| Facilitate contest creation | `01-create-contest.spec.json` | POST contest, POST entries |
| Participate in a contest | `02-participate.spec.json` | GET contest, POST entry, POST scores |
| Create custom contest type | `03-custom-config.spec.json` | POST config, POST contest with config |
| Edit a contest entry | `04-edit-entry.spec.json` | GET entry, PATCH entry |
| Edit scoring rounds | `05-edit-rounds.spec.json` | PATCH entries to change rounds |
| Edit my score | `06-edit-score.spec.json` | POST score, POST score (update) |
| Delete a Contest Entry | `07-delete-entry.spec.json` | DELETE entry, verify removed |
| Delete a Contest | `08-delete-contest.spec.json` | DELETE contest, verify removed |

## Running Tests

```bash
# Run all story tests
npm run test:stories

# Run in watch mode
npm run test:stories:watch

# Run a specific test file
npx vitest run src/tests/stories/specs/01-create-contest.spec.json

# Run with verbose output
npm run test:stories -- --reporter=verbose
```

## Best Practices

1. **Isolation**: Each test should create its own data and clean up after
2. **Unique IDs**: Use unique slugs/IDs per test run (consider adding timestamps)
3. **Order Independence**: Tests should not depend on each other
4. **Teardown**: Always include teardown to clean up created resources
5. **Validation**: Check both the action response AND the end-state via GET requests
6. **Error Cases**: Include tests for error scenarios (404, 400 responses)

## Mock vs Live Database

By default, tests run against your **live database**. For isolated, fast testing, use the in-memory provider:

```bash
# Run with mock backend (recommended for development)
npm run test:stories

# Run against live database (use with caution)
npm run test:stories:live
```

See **IN-MEMORY-PROVIDER.md** for complete setup instructions for the mock datastore.

### Benefits of In-Memory Testing

| Benefit | Description |
|---------|-------------|
| **Speed** | No network calls, millisecond execution |
| **Isolation** | Fresh data each test run |
| **No Side Effects** | No cleanup, no data pollution |
| **CI/CD Friendly** | No external dependencies |

## Troubleshooting

**Tests timing out**: Increase `testTimeout` in vitest config or add `delay` to actions.

**Variable not found**: Ensure the action that creates the variable runs before actions that use it, and uses `storeAs`.

**Cleanup failing**: If teardown fails, manually clean up data or add error handling.

**Server not running**: Ensure `npm run dev` is running before executing tests (not needed with in-memory provider).
