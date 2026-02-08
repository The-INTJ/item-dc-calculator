# User Story Test JSON Schema

Complete JSON schema reference for User Story API test specification files.

## Full Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserStoryTestSpec",
  "description": "JSON specification for testing a User Story via API calls",
  "type": "object",
  "required": ["story", "description", "baseUrl", "actions"],
  "properties": {
    "story": {
      "type": "string",
      "description": "The user story being tested (matches UserStories.md format)",
      "examples": ["As a user, I want to facilitate contest creation"]
    },
    "description": {
      "type": "string",
      "description": "Brief description of what this test validates",
      "examples": ["Create a contest with entries and verify end state"]
    },
    "baseUrl": {
      "type": "string",
      "description": "Base URL for all API calls",
      "default": "http://localhost:3000/api/contest",
      "examples": ["http://localhost:3000/api/contest"]
    },
    "variables": {
      "type": "object",
      "description": "Pre-defined variables available in all actions",
      "additionalProperties": true,
      "examples": [{ "testPrefix": "test-run-001" }]
    },
    "setup": {
      "type": "object",
      "description": "Actions to run before the main test",
      "properties": {
        "description": { "type": "string" },
        "actions": {
          "type": "array",
          "items": { "$ref": "#/definitions/Action" }
        }
      },
      "required": ["actions"]
    },
    "actions": {
      "type": "array",
      "description": "Main test actions to execute in order",
      "items": { "$ref": "#/definitions/Action" },
      "minItems": 1
    },
    "validate": {
      "type": "object",
      "description": "End-state validation checks after all actions complete",
      "properties": {
        "description": { "type": "string" },
        "checks": {
          "type": "array",
          "items": { "$ref": "#/definitions/Action" }
        }
      },
      "required": ["checks"]
    },
    "teardown": {
      "type": "object",
      "description": "Cleanup actions after test completes",
      "properties": {
        "description": { "type": "string" },
        "actions": {
          "type": "array",
          "items": { "$ref": "#/definitions/Action" }
        }
      },
      "required": ["actions"]
    }
  },
  "definitions": {
    "Action": {
      "type": "object",
      "required": ["id", "method", "endpoint"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for this action",
          "pattern": "^[a-z0-9-]+$",
          "examples": ["create-contest", "add-entry-1", "verify-deleted"]
        },
        "description": {
          "type": "string",
          "description": "Human-readable description of what this action does",
          "examples": ["Create a new contest with mixology template"]
        },
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PATCH", "DELETE"],
          "description": "HTTP method for the request"
        },
        "endpoint": {
          "type": "string",
          "description": "API endpoint path (supports {{variable}} interpolation)",
          "examples": ["/contests", "/contests/{{contest.slug}}/entries"]
        },
        "input": {
          "type": "object",
          "description": "Request body for POST/PATCH requests",
          "additionalProperties": true
        },
        "headers": {
          "type": "object",
          "description": "Additional request headers",
          "additionalProperties": { "type": "string" },
          "examples": [{ "x-contest-role": "admin" }]
        },
        "queryParams": {
          "type": "object",
          "description": "URL query parameters",
          "additionalProperties": { "type": "string" },
          "examples": [{ "entryId": "{{entry.id}}" }]
        },
        "output": {
          "$ref": "#/definitions/OutputValidation"
        },
        "storeAs": {
          "type": "string",
          "description": "Variable name to store the response body for later use",
          "pattern": "^[a-zA-Z][a-zA-Z0-9]*$",
          "examples": ["contest", "entry1", "score"]
        },
        "delay": {
          "type": "number",
          "description": "Milliseconds to wait before executing this action",
          "minimum": 0,
          "examples": [100, 500, 1000]
        },
        "skipIf": {
          "type": "string",
          "description": "Skip this action if the expression evaluates to true",
          "examples": ["{{contest.phase}} === 'scored'"]
        },
        "continueOnError": {
          "type": "boolean",
          "description": "Continue test execution even if this action fails",
          "default": false
        }
      }
    },
    "OutputValidation": {
      "type": "object",
      "description": "Expected response validation rules",
      "properties": {
        "status": {
          "type": "number",
          "description": "Expected HTTP status code",
          "examples": [200, 201, 204, 400, 404]
        },
        "body": {
          "type": "object",
          "description": "Exact match for response body fields (top-level only)",
          "additionalProperties": true,
          "examples": [{ "name": "Summer Mixology", "slug": "summer-mix" }]
        },
        "bodyContains": {
          "type": "object",
          "description": "Partial match using JSONPath",
          "properties": {
            "path": {
              "type": "string",
              "description": "JSONPath to the value (supports array notation)",
              "examples": ["entries[0].name", "config.attributes[2].id"]
            },
            "value": {
              "description": "Expected value at the path"
            }
          },
          "required": ["path", "value"]
        },
        "bodyNotContains": {
          "type": "object",
          "description": "Ensure a value is NOT present",
          "properties": {
            "path": { "type": "string" },
            "value": {}
          },
          "required": ["path", "value"]
        },
        "bodyMatches": {
          "type": "object",
          "description": "Regex pattern matching for string values",
          "properties": {
            "path": { "type": "string" },
            "pattern": {
              "type": "string",
              "description": "Regex pattern to match",
              "examples": ["^[a-z0-9-]+$", "\\d{4}-\\d{2}-\\d{2}"]
            }
          },
          "required": ["path", "pattern"]
        },
        "bodyLength": {
          "type": "object",
          "description": "Validate array length at a path",
          "properties": {
            "path": { "type": "string" },
            "min": { "type": "number" },
            "max": { "type": "number" },
            "exact": { "type": "number" }
          },
          "required": ["path"]
        },
        "headers": {
          "type": "object",
          "description": "Expected response headers",
          "additionalProperties": { "type": "string" }
        }
      }
    }
  }
}
```

## Field Details

### Actions

Each action represents a single API call with optional validation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique kebab-case identifier |
| `description` | string | No | Human-readable description |
| `method` | enum | Yes | `GET`, `POST`, `PATCH`, `DELETE` |
| `endpoint` | string | Yes | API path with optional `{{var}}` interpolation |
| `input` | object | No | Request body (POST/PATCH only) |
| `headers` | object | No | Additional request headers |
| `queryParams` | object | No | URL query parameters |
| `output` | object | No | Response validation rules |
| `storeAs` | string | No | Store response as variable |
| `delay` | number | No | Wait ms before executing |
| `skipIf` | string | No | Conditional skip expression |
| `continueOnError` | boolean | No | Don't fail test on error |

### Output Validation

Multiple validation types can be combined:

| Type | Purpose | Example |
|------|---------|---------|
| `status` | Validate HTTP status | `201` |
| `body` | Exact field match | `{ "name": "Test" }` |
| `bodyContains` | JSONPath partial match | `{ "path": "[0].id", "value": "abc" }` |
| `bodyNotContains` | Ensure NOT present | `{ "path": "error", "value": "..." }` |
| `bodyMatches` | Regex pattern match | `{ "path": "slug", "pattern": "^[a-z-]+$" }` |
| `bodyLength` | Array length check | `{ "path": "entries", "min": 2 }` |
| `headers` | Response header match | `{ "content-type": "application/json" }` |

### Variable Interpolation

Variables are stored from responses using `storeAs` and accessed with `{{variable.path}}`:

```json
{
  "actions": [
    {
      "id": "create",
      "method": "POST",
      "endpoint": "/contests",
      "input": { "name": "Test", "slug": "test-123", "configTemplate": "mixology" },
      "storeAs": "contest"
    },
    {
      "id": "get-by-slug",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}"
    },
    {
      "id": "get-by-id",
      "method": "GET",
      "endpoint": "/contests/{{contest.id}}"
    }
  ]
}
```

Supported paths:
- `{{contest}}` - Full stored object
- `{{contest.id}}` - Single property
- `{{contest.config.topic}}` - Nested property
- `{{entries[0].id}}` - Array index access

### Pre-defined Variables

Use the `variables` root field for constants:

```json
{
  "variables": {
    "testRunId": "run-20240715-001",
    "adminHeader": "admin"
  },
  "actions": [
    {
      "id": "create-with-prefix",
      "method": "POST",
      "endpoint": "/contests",
      "input": {
        "name": "Test Contest",
        "slug": "{{testRunId}}-contest"
      },
      "headers": {
        "x-contest-role": "{{adminHeader}}"
      }
    }
  ]
}
```
