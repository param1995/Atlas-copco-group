# Integration Plan

## Backend
- Project folder: backend
- Run command: npm --prefix backend run dev
- Port: 3000
- Build command: npm --prefix backend run build
- Health endpoint: /api/health
- API routes:
  - GET /api/health
  - GET /api/dashboard

## Frontend
- Project folder: apps/desktop
- Build command: npm --prefix apps/desktop run build
- Dev command: npm --prefix apps/desktop run start
- API seam: apps/desktop/src/api/index.ts
- Mock client to replace: apps/desktop/src/api/mockClient.ts
- Mock dataset files: apps/desktop/src/mocks/telemetry.ts
- Mock toggle: apps/desktop/src/api/previewState.ts
- Shared contract and types: apps/desktop/src/api/index.ts

## Database
- Type: local in-memory mock, no database
- Migration tool: not applicable
- Migration directory: not applicable
- Connection env vars: none required
- Note: No seed data is to be created.

## Services
- Essential: telemetry API + dashboard UI
- Enhancement: preview-state mock switcher, local mock data

## Shared types
- Shared package: not applicable for local-only app
- Import alias: none

## Integration Results
- Database migrations: Not applicable; the backend uses local in-memory telemetry and has no relational database.
- Backend build and tests: Passed (`npm --prefix backend run build`; `npm --prefix backend test`).
- Backend smoke tests: `GET /api/health` and `GET /api/dashboard` both returned HTTP 200.
- Frontend: Angular build passed; API seam now uses `src/api/client.ts` and the Angular dev proxy forwards `/api` to `http://localhost:3000`.
- Removed frontend mocks: `src/api/mockClient.ts`, `src/api/previewState.ts`, and `src/mocks/telemetry.ts`.
- End-to-end: Angular on port 50079 proxied `GET /api/dashboard` to the backend and returned HTTP 200 with four metrics; the dashboard rendered the live response.
- Verification servers were stopped after the checks.
