---
name: update-contest-api-docs
description: Update the OpenAPI documentation for /api/contest endpoints. Use when API routes change, new endpoints are added, or request/response schemas are modified.
---

# Update Contest API OpenAPI Documentation

Keep the `app/api/contest/openapi.json` file synchronized with the actual API implementation.

## Scope

This skill is scoped ONLY to `/api/contest` endpoints. Do not document other API routes.

## Route Files to Analyze

Scan these route files for the current API implementation:

- `app/api/contest/current/route.ts` - GET /current
- `app/api/contest/contests/route.ts` - GET/POST /contests
- `app/api/contest/contests/[id]/route.ts` - GET/PATCH/DELETE /contests/{id}
- `app/api/contest/contests/[id]/entries/route.ts` - GET/POST /contests/{id}/entries
- `app/api/contest/contests/[id]/entries/[entryId]/route.ts` - GET/PATCH/DELETE /contests/{id}/entries/{entryId}
- `app/api/contest/contests/[id]/scores/route.ts` - GET/POST /contests/{id}/scores
- `app/api/contest/docs/route.ts` - Serves the OpenAPI documentation

## Update Process

1. **Read the current OpenAPI spec** at `app/api/contest/openapi.json`
2. **Analyze each route file** to extract:
   - HTTP methods exported (GET, POST, PATCH, DELETE, PUT)
   - Request body schemas (from TypeScript interfaces and validation)
   - Query parameters (from `url.searchParams`)
   - Path parameters (from `params`)
   - Response schemas and status codes
3. **Compare** the current spec against the actual implementation
4. **Update the OpenAPI spec** to reflect:
   - New endpoints
   - Changed request/response schemas
   - New or modified query parameters
   - Updated descriptions based on code comments
   - Correct HTTP status codes
5. **Maintain consistency** with existing schema definitions in `components/schemas`

## OpenAPI Structure

The spec uses OpenAPI 3.1.0 with:
- Server base URL: `/api/contest`
- Tags: Contests, Entries, Scores
- Reusable schemas in `components/schemas`
- Security scheme: AdminRole (header-based)

## Schema Guidelines

- Reuse existing schemas from `components/schemas` when possible
- Add new schemas for new data structures
- Use `$ref` for schema references
- Include examples for request/response bodies
- Mark deprecated parameters appropriately

## Validation Checklist

After updating, verify:
- [ ] All exported route handlers have corresponding path operations
- [ ] Request body schemas match TypeScript interfaces
- [ ] Response status codes match the actual implementation
- [ ] Query parameters are documented with correct types
- [ ] Path parameters use consistent naming (`id`, `entryId`)
- [ ] Security requirements are applied correctly
