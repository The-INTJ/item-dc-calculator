# Contest API

This folder is the canonical CRUD boundary for contest data.

## Responsibilities

- validate requests
- apply auth/admin rules
- translate provider results into stable HTTP responses
- keep response shapes aligned with `openapi.json`

## Rules

- Prefer shared route helpers over repeating parsing/error boilerplate.
- Non-read admin operations should enforce `requireAdmin`.
- Keep response shapes stable even if backend providers change.
