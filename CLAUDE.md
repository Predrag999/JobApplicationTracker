# Job Application Tracker — Claude Instructions

## Mandatory: run /guard after every code change

After **every** file creation, edit, or deletion — no matter how small — invoke the `/guard` skill before reporting the task as done.

This applies to:
- Bug fixes
- New features
- Refactors
- Configuration changes
- Any edit to backend Java files or frontend TypeScript/TSX files

Do NOT skip the guard for "trivial" changes. A one-line edit can introduce a type mismatch, a missing i18n key, or a swallowed exception.

## Project context

- **Backend**: Spring Boot 3.x, Java 21+, PostgreSQL, Maven wrapper (`./mvnw.cmd` on Windows)
- **Frontend**: React 18, TypeScript, Vite, TanStack Query v5, Tailwind CSS v4, i18next
- **Backend port**: 8080 | **Frontend port**: 5173
- **DB**: PostgreSQL on port 5433, database `job_tracker`, user `postgres`

## Key conventions (enforced by /guard)

- DTOs are Java records — no Lombok
- Entities never leave the service layer; always map to a response record
- All UI strings use `t('key')` — no hardcoded English in JSX
- Every translatable string must exist in `en.ts`, `bg.ts`, and `de.ts`
- HTTP calls go through `src/api/client.ts` only
- `ResponseStatusException` needs its own `@ExceptionHandler` in `GlobalExceptionHandler` — never let the generic `Exception` handler swallow it
