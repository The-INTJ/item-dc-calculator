# ContestConfigs API Section

**Resource**: ContestConfigs (configurations for contests)
**Base Path**: `/api/contest/configs`
**Purpose**: Allow users to create and manage dynamic contest configurations

## Feature Requirements

### 1. List All Configurations (GET /configs)
**What it does**: Retrieve all available contest configurations from the datastore
- Users can browse available contest types before creating a contest

**Response structure**:
```json
[
  {
    "id": "mixology",
    "topic": "Mixology",
    "entryLabel": "Drink",
    "entryLabelPlural": "Drinks",
    "attributes": [...]
  },
  {
    "id": "beer-tasting",
    "topic": "Beer Tasting",
    "entryLabel": "Beer",
    "entryLabelPlural": "Beers",
    "attributes": [...]
  }
]
```

### 2. Create New Configuration (POST /configs)
**What it does**: Allow users to define custom contest types with their own scoring attributes

**Request body**:
```json
{
  "topic": "Beer Tasting Competition",
  "entryLabel": "Beer",
  "entryLabelPlural": "Beers",
  "attributes": [
    {
      "id": "appearance",
      "label": "Appearance",
      "description": "Color and clarity",
      "min": 0,
      "max": 10
    },
    {
      "id": "aroma",
      "label": "Aroma",
      "description": "Nose and smell profile",
      "min": 0,
      "max": 10
    },
    {
      "id": "taste",
      "label": "Taste",
      "description": "Flavor complexity",
      "min": 0,
      "max": 10
    },
    {
      "id": "mouthfeel",
      "label": "Mouthfeel",
      "description": "Texture and body",
      "min": 0,
      "max": 10
    },
    {
      "id": "overall",
      "label": "Overall",
      "description": "Final impression",
      "min": 0,
      "max": 10
    }
  ]
}
```

**Response**: Returns the created config with auto-generated ID and metadata (status 201)

### 3. Get Single Configuration (GET /configs/{configId})
**What it does**: Retrieve details of a specific configuration
- Allows contestants/judges to see exactly what they'll be scoring
- Provides validation for contest setup

**Response**: Full config object with all attributes and metadata

### 4. Update Configuration (PATCH /configs/{configId})
**What it does**: Modify an existing configuration
- Change attribute labels or descriptions
- Adjust scoring ranges
- Add/remove attributes (with caution about existing contests using this config)

**Request body**: Partial update of config fields

### 5. Delete Configuration (DELETE /configs/{configId})
**What it does**: Remove a custom configuration
- Only allow deletion if no contests are currently using it
- Prevent accidental loss of scoring templates

## File Structure

```
app/api/contest/configs/
├── route.ts                    # GET (list all), POST (create)
└── [configId]/
    └── route.ts               # GET (single), PATCH (update), DELETE (delete)
```

## Key Implementation Details

### Request Body Validation

Validate that:
- `topic` is required and non-empty (2-100 chars)
- `entryLabel` is required and non-empty
- `attributes` array has at least 1 attribute
- Each attribute has:
  - `id`: lowercase alphanumeric + hyphens (unique within config)
  - `label`: display name
  - `min` and `max`: numeric scoring range (min < max)
- No duplicate attribute IDs within a config

### Response Fields

Config objects should include:
- `id`: Auto-generated or user-provided slug (must be unique)
- `topic`: Contest type name
- `entryLabel`: Singular form
- `entryLabelPlural`: Plural form
- `attributes`: Array of scoring attributes

### Error Handling

Return appropriate status codes:
- `400`: Missing required fields, invalid attribute IDs, min >= max
- `404`: Config not found
- `409`: Duplicate ID (when creating), config in use (when deleting)
- `500`: Server errors

### Integration with Contests

When creating a contest with a configId:
```json
POST /contests
{
  "name": "Local Beer Tasting 2024",
  "slug": "local-beer-2024",
  "configId": "custom-beer-tasting",  // Reference config by ID
  ...
}
```

The contest loads the configuration at creation time.

## OpenAPI Documentation

### Schema Definition

```json
"ContestConfigAttribute": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "Unique attribute ID (lowercase, alphanumeric)", "example": "appearance" },
    "label": { "type": "string", "description": "Display name for judges", "example": "Appearance" },
    "description": { "type": "string", "description": "Helper text explaining what to judge" },
    "min": { "type": "number", "description": "Minimum score value", "default": 0 },
    "max": { "type": "number", "description": "Maximum score value", "default": 10 }
  },
  "required": ["id", "label"]
}
```

```json
"ContestConfigItem": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "example": "beer-tasting" },
    "topic": { "type": "string", "example": "Beer Tasting" },
    "entryLabel": { "type": "string", "example": "Beer" },
    "entryLabelPlural": { "type": "string", "example": "Beers" },
    "attributes": {
      "type": "array",
      "items": { "$ref": "#/components/schemas/ContestConfigAttribute" }
    }
  },
  "required": ["id", "topic", "entryLabel", "entryLabelPlural", "attributes"]
}
```

### Endpoint Documentation

Add tag:
```json
{ "name": "ContestConfigs", "description": "Manage contest configuration templates and scoring attributes" }
```

Add paths in OpenAPI with full CRUD operations following the Entries pattern.

## Implementation Checklist

- [ ] Create `app/api/contest/configs/route.ts` with GET and POST
- [ ] Create `app/api/contest/configs/[configId]/route.ts` with GET, PATCH, DELETE
- [ ] Add ContestConfigAttribute and ContestConfigItem schemas to OpenAPI
- [ ] Add /configs and /configs/{configId} paths to OpenAPI
- [ ] Add ContestConfigs tag to OpenAPI
- [ ] Implement validation for attribute IDs (lowercase, unique)
- [ ] Implement validation for score ranges (min < max)
- [ ] Add backend provider methods: list, create, getById, update, delete
- [ ] Add TypeScript interfaces to contestTypes.ts
- [ ] Prevent deletion of configs in active use
- [ ] Update /contests POST handler to accept configId parameter
- [ ] Update /contests/{id} GET to return full config object
- [ ] Run `/update-contest-api-docs` to sync OpenAPI
