# Firebase Layer

This folder owns Firebase-specific implementation details for the contest app.

## Responsibilities

- initialize Firebase clients
- implement backend provider contracts
- talk to Firestore
- normalize Firebase-specific data shapes

## Rules

- Keep Firebase details out of presentation helpers and most components.
- Route handlers and the backend provider are the CRUD boundary.
- Client-side Firebase usage outside this folder should be limited to auth and live subscriptions.
