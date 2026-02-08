User Stories:

As a user, I want to facilitate contest creation.
- Actions
-- Create a contest
--- Create a contest with a built-in config template (e.g., mixology, chili, cosplay, dance)
curl -X POST http://localhost:3000/api/contest/contests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Mixology Championship 2024",
    "slug": "summer-mix.0-2024",
    "configTemplate": "mixology",
    "location": "Downtown Convention Center",
    "startTime": "2024-07-15T10:00:00Z"
  }'

--- Or create a contest with a custom config
curl -X POST http://localhost:3000/api/contest/contests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Mixology Championship 2024",
    "slug": "summer-mix-2024",
    "location": "Downtown Convention Center",
    "startTime": "2024-07-15T10:00:00Z",
    "config": {
      "topic": "Mixology",
      "entryLabel": "Drink",
      "entryLabelPlural": "Drinks",
      "attributes": [
        {"id": "aroma", "label": "Aroma", "description": "How appealing is the scent?", "min": 0, "max": 10},
        {"id": "taste", "label": "Taste", "description": "How well do the flavors work together?", "min": 0, "max": 10},
        {"id": "presentation", "label": "Presentation", "description": "Visual appeal and garnish", "min": 0, "max": 10},
        {"id": "xfactor", "label": "X Factor", "description": "Originality and innovation", "min": 0, "max": 10},
        {"id": "overall", "label": "Overall", "description": "Overall impression", "min": 0, "max": 10}
      ]
    }
  }'

-- Add entries to the contest
--- Submit entries to the contest (repeat for each entry)
curl -X POST http://localhost:3000/api/contest/contests/summer-mix-2024/entries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Midnight Mojito",
    "slug": "midnight-mojito",
    "description": "A dark twist on the classic mojito with aged rum",
    "round": "semifinals",
    "submittedBy": "Jane Smith"
  }'

curl -X POST http://localhost:3000/api/contest/contests/summer-mix-2024/entries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunset Sangria",
    "slug": "sunset-sangria",
    "description": "Refreshing wine-based cocktail with fresh fruit",
    "round": "semifinals",
    "submittedBy": "John Doe"
  }'

-- Pick the ContestConfig for the type of contest
--- View available contest config templates
curl http://localhost:3000/api/contest/configs

--- Or create a custom config template
curl -X POST http://localhost:3000/api/contest/configs \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Beer Tasting",
    "entryLabel": "Beer",
    "entryLabelPlural": "Beers",
    "attributes": [
      {"id": "appearance", "label": "Appearance", "description": "Color and clarity", "min": 0, "max": 10},
      {"id": "aroma", "label": "Aroma", "description": "Nose and scent", "min": 0, "max": 10},
      {"id": "taste", "label": "Taste", "description": "Flavor profile", "min": 0, "max": 10},
      {"id": "overall", "label": "Overall", "description": "Overall impression", "min": 0, "max": 10}
    ]
  }'

-- Select number of scoring rounds
--- Note: Rounds are managed as part of the contest object. No dedicated API endpoint exists for editing the number of rounds.
--- Rounds are determined by the entries' "round" field values (e.g., "semifinals", "finals").

As a user, I want to participate in a contest.
- Actions
-- Join a contest
--- Note: There is no explicit "join" endpoint. Participation happens when you submit an entry or score.
--- To participate, retrieve the contest details to understand the structure
curl http://localhost:3000/api/contest/contests/summer-mix-2024

-- Add an entry to the contest
--- Submit your entry with entry details
curl -X POST http://localhost:3000/api/contest/contests/summer-mix-2024/entries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ocean Breeze",
    "slug": "ocean-breeze",
    "description": "Tropical drink with coconut rum and pineapple juice",
    "round": "semifinals",
    "submittedBy": "Alice Johnson"
  }'

-- Add scores to other entries in a contest round
--- Submit a full scoring breakdown for an entry
curl -X POST http://localhost:3000/api/contest/contests/summer-mix-2024/scores \
  -H "Content-Type: application/json" \
  -d '{
    "entryId": "midnight-mojito",
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
  }'

--- Or submit scores one category at a time
curl -X POST http://localhost:3000/api/contest/contests/summer-mix-2024/scores \
  -H "Content-Type: application/json" \
  -d '{
    "entryId": "sunset-sangria",
    "judgeId": "judge-alice-001",
    "categoryId": "aroma",
    "value": 7,
    "notes": "Good fruit aroma"
  }'

-- View scores for a contest
--- Get all scores in the contest
curl http://localhost:3000/api/contest/contests/summer-mix-2024/scores

--- Get scores for a specific entry
curl "http://localhost:3000/api/contest/contests/summer-mix-2024/scores?entryId=midnight-mojito"

--- Get scores from a specific judge
curl "http://localhost:3000/api/contest/contests/summer-mix-2024/scores?judgeId=judge-alice-001"

As a user, I want to create a custom contest type to run.
- Actions
-- Create a ContestConfig
--- Create a new contest configuration with custom attributes
curl -X POST http://localhost:3000/api/contest/configs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "craft-coffee",
    "topic": "Craft Coffee",
    "entryLabel": "Coffee",
    "entryLabelPlural": "Coffees",
    "attributes": [
      {"id": "aroma", "label": "Aroma", "description": "Smell and fragrance", "min": 0, "max": 10},
      {"id": "flavor", "label": "Flavor", "description": "Taste profile and complexity", "min": 0, "max": 10},
      {"id": "acidity", "label": "Acidity", "description": "Brightness and liveliness", "min": 0, "max": 10},
      {"id": "body", "label": "Body", "description": "Weight and texture", "min": 0, "max": 10},
      {"id": "finish", "label": "Finish", "description": "Aftertaste quality", "min": 0, "max": 10},
      {"id": "overall", "label": "Overall", "description": "Overall impression", "min": 0, "max": 10}
    ]
  }'

-- View available contest configs
--- List all available contest config templates
curl http://localhost:3000/api/contest/configs

-- Use the custom config to create a contest
--- Create a contest using your new custom config
curl -X POST http://localhost:3000/api/contest/contests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Coffee Tasting 2024",
    "slug": "annual-coffee-2024",
    "location": "Community Coffee House",
    "startTime": "2024-08-20T14:00:00Z",
    "config": {
      "id": "craft-coffee",
      "topic": "Craft Coffee",
      "entryLabel": "Coffee",
      "entryLabelPlural": "Coffees",
      "attributes": [
        {"id": "aroma", "label": "Aroma", "description": "Smell and fragrance", "min": 0, "max": 10},
        {"id": "flavor", "label": "Flavor", "description": "Taste profile and complexity", "min": 0, "max": 10},
        {"id": "acidity", "label": "Acidity", "description": "Brightness and liveliness", "min": 0, "max": 10},
        {"id": "body", "label": "Body", "description": "Weight and texture", "min": 0, "max": 10},
        {"id": "finish", "label": "Finish", "description": "Aftertaste quality", "min": 0, "max": 10},
        {"id": "overall", "label": "Overall", "description": "Overall impression", "min": 0, "max": 10}
      ]
    }
  }'

As a user, I want to edit a contest entry.
- Actions
-- Retrieve the entry details
--- Get the current entry information
curl http://localhost:3000/api/contest/contests/summer-mix-2024/entries/midnight-mojito

-- Update the entry information
--- Edit the entry's name, description, or round assignment
curl -X PATCH http://localhost:3000/api/contest/contests/summer-mix-2024/entries/midnight-mojito \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Midnight Mojito Premium",
    "description": "A dark twist on the classic mojito with aged rum and fresh mint",
    "round": "finals"
  }'

--- Update just the description
curl -X PATCH http://localhost:3000/api/contest/contests/summer-mix-2024/entries/midnight-mojito \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Now with a secret ingredient for extra depth"
  }'

As a user, I want to edit a contest's number of scoring rounds.
- Actions
-- View current contest information
--- Get the contest details to see current structure
curl http://localhost:3000/api/contest/contests/summer-mix-2024

-- Update the contest's round structure
--- Note: Rounds are managed through the entries' "round" field (e.g., "semifinals", "finals").
--- There is no dedicated API endpoint for managing rounds separately.
--- Rounds are implicitly defined by the distinct round values in entries.
--- Update the contest object with additional information if needed
curl -X PATCH http://localhost:3000/api/contest/contests/summer-mix-2024 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Mixology Championship 2024 - Extended"
  }'

-- Change entries to different rounds
--- Move entries to new rounds by updating each entry
curl -X PATCH http://localhost:3000/api/contest/contests/summer-mix-2024/entries/midnight-mojito \
  -H "Content-Type: application/json" \
  -d '{"round": "finals"}'

curl -X PATCH http://localhost:3000/api/contest/contests/summer-mix-2024/entries/sunset-sangria \
  -H "Content-Type: application/json" \
  -d '{"round": "finals"}'

As a user, I want to edit my score for an entry of a round.
- Actions
-- View your current scores for an entry
--- Get scores you submitted as a judge
curl "http://localhost:3000/api/contest/contests/summer-mix-2024/scores?judgeId=judge-alice-001"

-- Update your score with a full breakdown
--- Submit an updated score with all category ratings
curl -X POST http://localhost:3000/api/contest/contests/summer-mix-2024/scores \
  -H "Content-Type: application/json" \
  -d '{
    "entryId": "midnight-mojito",
    "judgeId": "judge-alice-001",
    "breakdown": {
      "aroma": 9,
      "taste": 9,
      "presentation": 8,
      "xfactor": 8,
      "overall": 9
    },
    "notes": "Reconsidered - excellent innovation and execution"
  }'

-- Update a single category score
--- Submit just one updated category while keeping others
curl -X POST http://localhost:3000/api/contest/contests/summer-mix-2024/scores \
  -H "Content-Type: application/json" \
  -d '{
    "entryId": "sunset-sangria",
    "judgeId": "judge-alice-001",
    "categoryId": "taste",
    "value": 8,
    "notes": "Improved on further tasting"
  }'

As a user, I want to delete a Contest Entry.
- Actions
-- Select the entry to delete
--- View the entry details before deleting
curl http://localhost:3000/api/contest/contests/summer-mix-2024/entries/midnight-mojito

-- Delete the contest entry
--- Remove the entry from the contest
curl -X DELETE http://localhost:3000/api/contest/contests/summer-mix-2024/entries/midnight-mojito

-- Verify the entry is deleted
--- Confirm the entry no longer appears in the entries list
curl http://localhost:3000/api/contest/contests/summer-mix-2024/entries

As a user, I want to delete a Contest.
- Actions
-- View the contest to be deleted
--- Get the contest details to confirm it's the right one
curl http://localhost:3000/api/contest/contests/summer-mix-2024

-- Delete the contest
--- Remove the entire contest and all associated data
curl -X DELETE http://localhost:3000/api/contest/contests/summer-mix-2024

-- Verify the contest is deleted
--- Confirm the contest no longer appears in the contests list
curl http://localhost:3000/api/contest/contests