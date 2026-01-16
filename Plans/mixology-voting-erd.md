# Mixology voting ERD

## Overview
This ERD models the Mixology voting flow as implemented in the app. Contests define the overall event, categories (the scoring dimensions like aroma/balance), and the drinks that are being judged. Judges (users) submit scores per drink, which are stored as score entries with a breakdown per category. Separately, we persist a user's submitted votes in `mixology_votes` so the UI can prefill sliders for authenticated or guest sessions. Firestore rules/logic can enforce uniqueness for the `(contestId, drinkId, judgeId)` score entry and the `(userId, contestId, drinkId)` user vote so each judge has a single canonical submission per drink while still supporting per-user recall in the UI.

## ERD
```mermaid
erDiagram
  CONTEST ||--o{ DRINK : has
  CONTEST ||--o{ VOTE_CATEGORY : defines
  CONTEST ||--o{ SCORE_ENTRY : collects
  CONTEST ||--o{ JUDGE : includes

  DRINK ||--o{ SCORE_ENTRY : receives
  JUDGE ||--o{ SCORE_ENTRY : submits

  USER_PROFILE ||--o{ USER_VOTE : records
  CONTEST ||--o{ USER_VOTE : includes
  DRINK ||--o{ USER_VOTE : covers

  CONTEST {
    string id
    string slug
    string name
    string phase
    string bracketRound
    string location
  }

  DRINK {
    string id
    string contestId
    string name
    string description
    string submittedBy
    string round
  }

  VOTE_CATEGORY {
    string id
    string contestId
    string label
    int sortOrder
    string description
  }

  JUDGE {
    string id
    string contestId
    string displayName
    string role
    string contact
  }

  SCORE_ENTRY {
    string id
    string contestId
    string drinkId
    string judgeId
    map breakdown
    string notes
  }

  USER_PROFILE {
    string id
    string displayName
    string email
    string role
    string avatarUrl
  }

  USER_VOTE {
    string id
    string userId
    string contestId
    string drinkId
    int score
    map breakdown
    string notes
    timestamp timestamp
  }
```
