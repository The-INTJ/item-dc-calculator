# Contest API

This folder defines the HTTP contract for contest data.

## Responsibilities

- validate requests
- apply auth/admin rules
- translate provider results into stable HTTP responses
- keep response shapes aligned with `openapi.json`
- stay consistent with the live browser data path until a full server migration exists
- serve as an optional HTTP surface for integrations, docs, and future server-backed workflows

## Rules

- Prefer shared route helpers over repeating parsing/error boilerplate.
- Non-read admin operations should enforce `requireAdmin`.
- Keep response shapes stable even if backend providers change.
- Do not assume the browser client is fully routed through these handlers.
- OpenAPI documents this surface; it does not force the browser app to use it.
