# User Story Test Examples

Complete JSON test file examples for each User Story from `UserStories.md`.

## 1. Facilitate Contest Creation

**File:** `src/tests/stories/specs/01-create-contest.spec.json`

```json
{
  "story": "As a user, I want to facilitate contest creation",
  "description": "Create a contest with config template, add entries, and verify end state",
  "baseUrl": "http://localhost:3000/api/contest",
  "actions": [
    {
      "id": "create-contest-with-template",
      "description": "Create a new contest using the mixology config template",
      "method": "POST",
      "endpoint": "/contests",
      "input": {
        "name": "Summer Mixology Championship 2024",
        "slug": "test-summer-mix-2024",
        "configTemplate": "mixology",
        "location": "Downtown Convention Center",
        "startTime": "2024-07-15T10:00:00Z"
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
      "description": "Add Midnight Mojito entry",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Midnight Mojito",
        "slug": "midnight-mojito",
        "description": "A dark twist on the classic mojito with aged rum",
        "round": "semifinals",
        "submittedBy": "Jane Smith"
      },
      "output": {
        "status": 201,
        "body": {
          "name": "Midnight Mojito",
          "slug": "midnight-mojito"
        }
      },
      "storeAs": "entry1"
    },
    {
      "id": "add-entry-2",
      "description": "Add Sunset Sangria entry",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Sunset Sangria",
        "slug": "sunset-sangria",
        "description": "Refreshing wine-based cocktail with fresh fruit",
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
    "description": "Verify contest was created with correct config and entries",
    "checks": [
      {
        "id": "verify-contest-exists",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}",
        "output": {
          "status": 200,
          "body": {
            "name": "Summer Mixology Championship 2024",
            "location": "Downtown Convention Center"
          },
          "bodyContains": {
            "path": "config.topic",
            "value": "Mixology"
          }
        }
      },
      {
        "id": "verify-entries-exist",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "output": {
          "status": 200,
          "bodyLength": {
            "path": "",
            "exact": 2
          }
        }
      }
    ]
  },
  "teardown": {
    "description": "Clean up test contest",
    "actions": [
      {
        "id": "delete-contest",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}",
        "continueOnError": true
      }
    ]
  }
}
```

## 2. Participate in a Contest

**File:** `src/tests/stories/specs/02-participate.spec.json`

```json
{
  "story": "As a user, I want to participate in a contest",
  "description": "Join a contest by adding an entry and submitting scores",
  "baseUrl": "http://localhost:3000/api/contest",
  "setup": {
    "description": "Create a contest to participate in",
    "actions": [
      {
        "id": "setup-contest",
        "method": "POST",
        "endpoint": "/contests",
        "input": {
          "name": "Participation Test Contest",
          "slug": "test-participate-contest",
          "configTemplate": "mixology"
        },
        "storeAs": "contest"
      },
      {
        "id": "setup-entry",
        "method": "POST",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "input": {
          "name": "Existing Entry",
          "slug": "existing-entry",
          "description": "An entry to score",
          "round": "semifinals",
          "submittedBy": "Contest Host"
        },
        "storeAs": "existingEntry"
      }
    ]
  },
  "actions": [
    {
      "id": "view-contest",
      "description": "View contest details to understand structure",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}",
      "output": {
        "status": 200
      }
    },
    {
      "id": "add-my-entry",
      "description": "Submit my own entry to the contest",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Ocean Breeze",
        "slug": "ocean-breeze",
        "description": "Tropical drink with coconut rum and pineapple juice",
        "round": "semifinals",
        "submittedBy": "Alice Johnson"
      },
      "output": {
        "status": 201,
        "body": {
          "name": "Ocean Breeze",
          "submittedBy": "Alice Johnson"
        }
      },
      "storeAs": "myEntry"
    },
    {
      "id": "submit-score-full-breakdown",
      "description": "Score another entry with full breakdown",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/scores",
      "input": {
        "entryId": "{{existingEntry.id}}",
        "judgeId": "judge-alice-001",
        "judgeName": "Alice Johnson",
        "breakdown": {
          "aroma": 8,
          "taste": 9,
          "presentation": 8,
          "xfactor": 7,
          "overall": 8
        },
        "notes": "Excellent flavor balance and presentation"
      },
      "output": {
        "status": 201
      },
      "storeAs": "score"
    },
    {
      "id": "submit-score-single-category",
      "description": "Submit a single category score",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/scores",
      "input": {
        "entryId": "{{myEntry.id}}",
        "judgeId": "judge-bob-002",
        "judgeName": "Bob Smith",
        "categoryId": "overall",
        "value": 7
      },
      "output": {
        "status": 201
      }
    }
  ],
  "validate": {
    "description": "Verify participation was successful",
    "checks": [
      {
        "id": "verify-my-entry-exists",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries/{{myEntry.id}}",
        "output": {
          "status": 200,
          "body": {
            "name": "Ocean Breeze"
          }
        }
      },
      {
        "id": "verify-scores-exist",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/scores",
        "queryParams": {
          "judgeId": "judge-alice-001"
        },
        "output": {
          "status": 200,
          "bodyLength": {
            "path": "scores",
            "min": 1
          }
        }
      }
    ]
  },
  "teardown": {
    "actions": [
      {
        "id": "cleanup",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}",
        "continueOnError": true
      }
    ]
  }
}
```

## 3. Create Custom Contest Type

**File:** `src/tests/stories/specs/03-custom-config.spec.json`

```json
{
  "story": "As a user, I want to create a custom contest type to run",
  "description": "Create a custom ContestConfig and use it to create a contest",
  "baseUrl": "http://localhost:3000/api/contest",
  "actions": [
    {
      "id": "create-custom-config",
      "description": "Create a new custom contest configuration",
      "method": "POST",
      "endpoint": "/configs",
      "input": {
        "id": "test-craft-coffee",
        "topic": "Craft Coffee",
        "entryLabel": "Coffee",
        "entryLabelPlural": "Coffees",
        "attributes": [
          { "id": "aroma", "label": "Aroma", "description": "Smell and fragrance", "min": 0, "max": 10 },
          { "id": "flavor", "label": "Flavor", "description": "Taste profile", "min": 0, "max": 10 },
          { "id": "acidity", "label": "Acidity", "description": "Brightness", "min": 0, "max": 10 },
          { "id": "body", "label": "Body", "description": "Weight and texture", "min": 0, "max": 10 },
          { "id": "finish", "label": "Finish", "description": "Aftertaste", "min": 0, "max": 10 },
          { "id": "overall", "label": "Overall", "description": "Overall impression", "min": 0, "max": 10 }
        ]
      },
      "output": {
        "status": 201,
        "body": {
          "topic": "Craft Coffee",
          "entryLabel": "Coffee"
        }
      },
      "storeAs": "config"
    },
    {
      "id": "verify-config-in-list",
      "description": "Verify config appears in the list",
      "method": "GET",
      "endpoint": "/configs",
      "output": {
        "status": 200
      }
    },
    {
      "id": "create-contest-with-custom-config",
      "description": "Create a contest using the custom config",
      "method": "POST",
      "endpoint": "/contests",
      "input": {
        "name": "Annual Coffee Tasting 2024",
        "slug": "test-annual-coffee-2024",
        "location": "Community Coffee House",
        "config": {
          "id": "test-craft-coffee",
          "topic": "Craft Coffee",
          "entryLabel": "Coffee",
          "entryLabelPlural": "Coffees",
          "attributes": [
            { "id": "aroma", "label": "Aroma", "description": "Smell and fragrance", "min": 0, "max": 10 },
            { "id": "flavor", "label": "Flavor", "description": "Taste profile", "min": 0, "max": 10 },
            { "id": "acidity", "label": "Acidity", "description": "Brightness", "min": 0, "max": 10 },
            { "id": "body", "label": "Body", "description": "Weight and texture", "min": 0, "max": 10 },
            { "id": "finish", "label": "Finish", "description": "Aftertaste", "min": 0, "max": 10 },
            { "id": "overall", "label": "Overall", "description": "Overall impression", "min": 0, "max": 10 }
          ]
        }
      },
      "output": {
        "status": 201,
        "body": {
          "name": "Annual Coffee Tasting 2024"
        }
      },
      "storeAs": "contest"
    }
  ],
  "validate": {
    "checks": [
      {
        "id": "verify-contest-has-custom-config",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}",
        "output": {
          "status": 200,
          "bodyContains": {
            "path": "config.topic",
            "value": "Craft Coffee"
          }
        }
      },
      {
        "id": "verify-config-attributes",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}",
        "output": {
          "status": 200,
          "bodyLength": {
            "path": "config.attributes",
            "exact": 6
          }
        }
      }
    ]
  },
  "teardown": {
    "actions": [
      {
        "id": "delete-contest",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}",
        "continueOnError": true
      },
      {
        "id": "delete-config",
        "method": "DELETE",
        "endpoint": "/configs/{{config.id}}",
        "continueOnError": true
      }
    ]
  }
}
```

## 4. Edit Contest Entry

**File:** `src/tests/stories/specs/04-edit-entry.spec.json`

```json
{
  "story": "As a user, I want to edit a contest entry",
  "description": "Retrieve and update entry details",
  "baseUrl": "http://localhost:3000/api/contest",
  "setup": {
    "actions": [
      {
        "id": "setup-contest",
        "method": "POST",
        "endpoint": "/contests",
        "input": {
          "name": "Edit Entry Test",
          "slug": "test-edit-entry",
          "configTemplate": "mixology"
        },
        "storeAs": "contest"
      },
      {
        "id": "setup-entry",
        "method": "POST",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "input": {
          "name": "Original Name",
          "slug": "original-entry",
          "description": "Original description",
          "round": "semifinals",
          "submittedBy": "Test User"
        },
        "storeAs": "entry"
      }
    ]
  },
  "actions": [
    {
      "id": "get-entry-before",
      "description": "Retrieve entry details before editing",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entry.id}}",
      "output": {
        "status": 200,
        "body": {
          "name": "Original Name",
          "description": "Original description"
        }
      }
    },
    {
      "id": "update-entry-multiple-fields",
      "description": "Update name, description, and round",
      "method": "PATCH",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entry.id}}",
      "input": {
        "name": "Updated Name Premium",
        "description": "Updated description with more detail",
        "round": "finals"
      },
      "output": {
        "status": 200,
        "body": {
          "name": "Updated Name Premium",
          "round": "finals"
        }
      }
    },
    {
      "id": "update-entry-single-field",
      "description": "Update just the description",
      "method": "PATCH",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entry.id}}",
      "input": {
        "description": "Final description after multiple edits"
      },
      "output": {
        "status": 200
      }
    }
  ],
  "validate": {
    "checks": [
      {
        "id": "verify-final-state",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries/{{entry.id}}",
        "output": {
          "status": 200,
          "body": {
            "name": "Updated Name Premium",
            "description": "Final description after multiple edits",
            "round": "finals"
          }
        }
      }
    ]
  },
  "teardown": {
    "actions": [
      {
        "id": "cleanup",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}",
        "continueOnError": true
      }
    ]
  }
}
```

## 5. Edit Contest Scoring Rounds

**File:** `src/tests/stories/specs/05-edit-rounds.spec.json`

```json
{
  "story": "As a user, I want to edit a contest's number of scoring rounds",
  "description": "Change entries between rounds (rounds are implicit via entry assignments)",
  "baseUrl": "http://localhost:3000/api/contest",
  "setup": {
    "actions": [
      {
        "id": "setup-contest",
        "method": "POST",
        "endpoint": "/contests",
        "input": {
          "name": "Round Edit Test",
          "slug": "test-round-edit",
          "configTemplate": "mixology"
        },
        "storeAs": "contest"
      },
      {
        "id": "setup-entry-1",
        "method": "POST",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "input": {
          "name": "Entry One",
          "slug": "entry-one",
          "description": "First entry",
          "round": "quarterfinals",
          "submittedBy": "User 1"
        },
        "storeAs": "entry1"
      },
      {
        "id": "setup-entry-2",
        "method": "POST",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "input": {
          "name": "Entry Two",
          "slug": "entry-two",
          "description": "Second entry",
          "round": "quarterfinals",
          "submittedBy": "User 2"
        },
        "storeAs": "entry2"
      }
    ]
  },
  "actions": [
    {
      "id": "view-contest-initial",
      "description": "View initial contest structure",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}",
      "output": {
        "status": 200
      }
    },
    {
      "id": "advance-entry-1-to-semifinals",
      "description": "Move entry 1 to semifinals round",
      "method": "PATCH",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entry1.id}}",
      "input": {
        "round": "semifinals"
      },
      "output": {
        "status": 200,
        "body": {
          "round": "semifinals"
        }
      }
    },
    {
      "id": "advance-entry-2-to-semifinals",
      "description": "Move entry 2 to semifinals round",
      "method": "PATCH",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entry2.id}}",
      "input": {
        "round": "semifinals"
      },
      "output": {
        "status": 200,
        "body": {
          "round": "semifinals"
        }
      }
    },
    {
      "id": "advance-entry-1-to-finals",
      "description": "Move entry 1 to finals round",
      "method": "PATCH",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entry1.id}}",
      "input": {
        "round": "finals"
      },
      "output": {
        "status": 200,
        "body": {
          "round": "finals"
        }
      }
    }
  ],
  "validate": {
    "description": "Note: Rounds are managed through entries, not as a separate resource",
    "checks": [
      {
        "id": "verify-entry-1-in-finals",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries/{{entry1.id}}",
        "output": {
          "status": 200,
          "body": {
            "round": "finals"
          }
        }
      },
      {
        "id": "verify-entry-2-in-semifinals",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries/{{entry2.id}}",
        "output": {
          "status": 200,
          "body": {
            "round": "semifinals"
          }
        }
      }
    ]
  },
  "teardown": {
    "actions": [
      {
        "id": "cleanup",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}",
        "continueOnError": true
      }
    ]
  }
}
```

## 6. Edit My Score

**File:** `src/tests/stories/specs/06-edit-score.spec.json`

```json
{
  "story": "As a user, I want to edit my score for an entry of a round",
  "description": "Submit initial score, then update it",
  "baseUrl": "http://localhost:3000/api/contest",
  "setup": {
    "actions": [
      {
        "id": "setup-contest",
        "method": "POST",
        "endpoint": "/contests",
        "input": {
          "name": "Score Edit Test",
          "slug": "test-score-edit",
          "configTemplate": "mixology"
        },
        "storeAs": "contest"
      },
      {
        "id": "setup-entry",
        "method": "POST",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "input": {
          "name": "Entry to Score",
          "slug": "entry-to-score",
          "description": "An entry for scoring tests",
          "round": "finals",
          "submittedBy": "Entry Owner"
        },
        "storeAs": "entry"
      }
    ]
  },
  "variables": {
    "judgeId": "test-judge-score-edit"
  },
  "actions": [
    {
      "id": "submit-initial-score",
      "description": "Submit initial score with full breakdown",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/scores",
      "input": {
        "entryId": "{{entry.id}}",
        "judgeId": "{{judgeId}}",
        "judgeName": "Test Judge",
        "breakdown": {
          "aroma": 6,
          "taste": 6,
          "presentation": 6,
          "xfactor": 6,
          "overall": 6
        },
        "notes": "Initial assessment"
      },
      "output": {
        "status": 201
      },
      "storeAs": "initialScore"
    },
    {
      "id": "verify-initial-score",
      "description": "Verify the initial score was saved",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}/scores",
      "queryParams": {
        "judgeId": "{{judgeId}}"
      },
      "output": {
        "status": 200
      }
    },
    {
      "id": "update-score-full-breakdown",
      "description": "Update the score with improved ratings",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/scores",
      "input": {
        "entryId": "{{entry.id}}",
        "judgeId": "{{judgeId}}",
        "breakdown": {
          "aroma": 9,
          "taste": 9,
          "presentation": 8,
          "xfactor": 8,
          "overall": 9
        },
        "notes": "Reconsidered - excellent innovation and execution"
      },
      "output": {
        "status": 200
      }
    },
    {
      "id": "update-single-category",
      "description": "Update just one category",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/scores",
      "input": {
        "entryId": "{{entry.id}}",
        "judgeId": "{{judgeId}}",
        "categoryId": "presentation",
        "value": 10,
        "notes": "Perfect presentation on second look"
      },
      "output": {
        "status": 200
      }
    }
  ],
  "validate": {
    "checks": [
      {
        "id": "verify-updated-score",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/scores",
        "queryParams": {
          "judgeId": "{{judgeId}}",
          "entryId": "{{entry.id}}"
        },
        "output": {
          "status": 200
        }
      }
    ]
  },
  "teardown": {
    "actions": [
      {
        "id": "cleanup",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}",
        "continueOnError": true
      }
    ]
  }
}
```

## 7. Delete Contest Entry

**File:** `src/tests/stories/specs/07-delete-entry.spec.json`

```json
{
  "story": "As a user, I want to delete a Contest Entry",
  "description": "Delete an entry and verify it no longer exists",
  "baseUrl": "http://localhost:3000/api/contest",
  "setup": {
    "actions": [
      {
        "id": "setup-contest",
        "method": "POST",
        "endpoint": "/contests",
        "input": {
          "name": "Delete Entry Test",
          "slug": "test-delete-entry",
          "configTemplate": "mixology"
        },
        "storeAs": "contest"
      },
      {
        "id": "setup-entry-to-delete",
        "method": "POST",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "input": {
          "name": "Entry To Delete",
          "slug": "entry-to-delete",
          "description": "This entry will be deleted",
          "round": "finals",
          "submittedBy": "Test User"
        },
        "storeAs": "entryToDelete"
      },
      {
        "id": "setup-entry-to-keep",
        "method": "POST",
        "endpoint": "/contests/{{contest.slug}}/entries",
        "input": {
          "name": "Entry To Keep",
          "slug": "entry-to-keep",
          "description": "This entry will remain",
          "round": "finals",
          "submittedBy": "Test User 2"
        },
        "storeAs": "entryToKeep"
      }
    ]
  },
  "actions": [
    {
      "id": "verify-entry-exists-before",
      "description": "Confirm the entry exists before deletion",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entryToDelete.id}}",
      "output": {
        "status": 200,
        "body": {
          "name": "Entry To Delete"
        }
      }
    },
    {
      "id": "delete-entry",
      "description": "Delete the entry",
      "method": "DELETE",
      "endpoint": "/contests/{{contest.slug}}/entries/{{entryToDelete.id}}",
      "output": {
        "status": 200,
        "body": {
          "success": true
        }
      }
    }
  ],
  "validate": {
    "checks": [
      {
        "id": "verify-entry-deleted",
        "description": "Confirm deleted entry returns 404",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries/{{entryToDelete.id}}",
        "output": {
          "status": 404
        }
      },
      {
        "id": "verify-other-entry-still-exists",
        "description": "Confirm other entry was not affected",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}/entries/{{entryToKeep.id}}",
        "output": {
          "status": 200,
          "body": {
            "name": "Entry To Keep"
          }
        }
      }
    ]
  },
  "teardown": {
    "actions": [
      {
        "id": "cleanup",
        "method": "DELETE",
        "endpoint": "/contests/{{contest.id}}",
        "continueOnError": true
      }
    ]
  }
}
```

## 8. Delete Contest

**File:** `src/tests/stories/specs/08-delete-contest.spec.json`

```json
{
  "story": "As a user, I want to delete a Contest",
  "description": "Delete a contest and verify it no longer exists",
  "baseUrl": "http://localhost:3000/api/contest",
  "actions": [
    {
      "id": "create-contest-to-delete",
      "description": "Create a contest that will be deleted",
      "method": "POST",
      "endpoint": "/contests",
      "input": {
        "name": "Contest To Delete",
        "slug": "test-contest-to-delete",
        "configTemplate": "mixology",
        "location": "Test Location"
      },
      "output": {
        "status": 201
      },
      "storeAs": "contest"
    },
    {
      "id": "add-entry-to-contest",
      "description": "Add an entry to verify cascade delete",
      "method": "POST",
      "endpoint": "/contests/{{contest.slug}}/entries",
      "input": {
        "name": "Entry In Contest",
        "slug": "entry-in-contest",
        "description": "Should be deleted with contest",
        "round": "finals",
        "submittedBy": "Test User"
      },
      "output": {
        "status": 201
      },
      "storeAs": "entry"
    },
    {
      "id": "verify-contest-exists",
      "description": "Confirm contest exists before deletion",
      "method": "GET",
      "endpoint": "/contests/{{contest.slug}}",
      "output": {
        "status": 200,
        "body": {
          "name": "Contest To Delete"
        }
      }
    },
    {
      "id": "delete-contest",
      "description": "Delete the contest",
      "method": "DELETE",
      "endpoint": "/contests/{{contest.id}}",
      "output": {
        "status": 200,
        "body": {
          "success": true
        }
      }
    }
  ],
  "validate": {
    "checks": [
      {
        "id": "verify-contest-deleted",
        "description": "Confirm contest returns 404",
        "method": "GET",
        "endpoint": "/contests/{{contest.slug}}",
        "output": {
          "status": 404
        }
      },
      {
        "id": "verify-contest-not-in-list",
        "description": "Confirm contest is not in the list",
        "method": "GET",
        "endpoint": "/contests",
        "queryParams": {
          "slug": "test-contest-to-delete"
        },
        "output": {
          "status": 200,
          "bodyNotContains": {
            "path": "contests[0].slug",
            "value": "test-contest-to-delete"
          }
        }
      }
    ]
  }
}
```

## Running Examples

```bash
# Run all story tests
npm run test:stories

# Run a specific test
npx vitest run src/tests/stories/specs/01-create-contest.spec.json

# Run with verbose output
npm run test:stories -- --reporter=verbose

# Watch mode
npm run test:stories:watch
```
