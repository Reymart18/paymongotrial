# Production-Ready Sync Refactor Plan

## Summary
Prepare the existing portal codebase for production without deploying and without adding a runnable Server PC sync service yet. Local development keeps DBF reading through `SYNC_MODE=local_dbf`; production uses `SYNC_MODE=push_api`, where the VPS never reads DBF files and only receives JSON from the future Server PC sync service.

## Backend Changes
- Add environment sync mode support:
  - `SYNC_MODE=local_dbf` for localhost development.
  - `SYNC_MODE=push_api` for production.
  - Default to `local_dbf` only when `NODE_ENV` is not production.
- Guard all direct DBF behavior behind `SYNC_MODE=local_dbf`:
  - `/foxpro/payments/sync`
  - `/foxpro/billings/sync`
  - `/foxpro/members/sync`
  - scheduled DBF payment polling
  - DBF file upload parsing
- Add a new `sync` module with:
  - `SyncRequest` entity/table using: `id`, `type`, `status`, `requested_by`, `requested_at`, `started_at`, `completed_at`, `error_message`, `records_processed`, `records_updated`.
  - request endpoints for portal/admin:
    - `POST /sync/request/members`
    - `POST /sync/request/payments`
    - `POST /sync/request/billing`
  - Server PC polling/job endpoints:
    - `GET /sync/requests/pending`
    - `POST /sync/requests/:id/start`
    - `POST /sync/requests/:id/complete`
    - `POST /sync/requests/:id/fail`
  - JSON receiving endpoints:
    - `POST /sync/members`
    - `POST /sync/payments`
    - `POST /sync/billings`
- Protect Server PC endpoints with `SYNC_API_KEY`, accepting either:
  - `Authorization: Bearer <SYNC_API_KEY>`
  - `x-api-key: <SYNC_API_KEY>`
- Prevent duplicate/overlapping jobs:
  - Reject creating a pending request if the same type already has `pending` or `processing`.
  - Reject starting a request if any request is already `processing`.
- Reuse existing FoxPro save logic by refactoring it into JSON-safe methods:
  - save normalized member records
  - save normalized payment records
  - save normalized billing records
  - keep DBF parsing separate and local-only.
- Add sync status API for dashboard display:
  - latest sync time
  - current status
  - last synced table
  - records updated
  - error message
  - inferred server availability from recent `/sync/requests/pending` polling.

## Frontend And Env
- Update admin sync buttons to call `/sync/request/*` instead of `/foxpro/*/sync`.
- Show “Sync requested”, “Sync in progress”, completed/failed state, records updated, and last error from the new sync status API.
- Keep localhost workflow functional with `.env.development.example` containing DBF paths.
- Add `.env.production.example` without DBF paths, using placeholders like:
  - `SYNC_MODE=push_api`
  - `API_BASE_URL=https://api.yourdomain.com`
  - `DB_NAME=hoa_production`
  - `DB_PASS=strongpassword`
  - `SYNC_API_KEY=strongpassword`
- Document the future Server PC sync service contract in docs: it reads DBF locally, converts to the normalized JSON payloads, polls pending requests, pushes to VPS endpoints, and marks jobs complete/failed.

## Test Plan
- Run backend build and targeted tests.
- Verify `SYNC_MODE=local_dbf` still allows existing local DBF sync endpoints.
- Verify `SYNC_MODE=push_api` blocks every direct DBF sync/read path.
- Verify admin request endpoints create one pending request and reject duplicates.
- Verify Server PC endpoints require API key/bearer token.
- Verify pushed JSON updates MySQL mirror tables and updates sync request/status fields.
- Verify frontend build succeeds and sync buttons use request flow.

## Assumptions
- This pass will not create a separate runnable Server PC sync service package.
- Production deployments will use `SYNC_MODE=push_api`.
- DBF paths remain development-only and must not appear in production env examples.
- FoxPro remains source of truth, Server PC sync service is the bridge, VPS MySQL is the online mirror, and the portal is the user interface.


--------------------------------------------------------------------------------------------

Implemented the portal-only production sync refactor. No deployment was done.
What changed:
Added SYNC_MODE support with local_dbf / push_api.
Gated all direct DBF sync/upload paths so they only run in SYNC_MODE=local_dbf.
Added the new backend sync module:sync_requests entity/table
admin request endpoints
Server PC polling/job lifecycle endpoints
pushed JSON receive endpoints
API key / bearer token protection
duplicate pending request and overlapping processing prevention
/sync/status for dashboard status display

Refactored FoxproService so pushed JSON uses the same MySQL upsert logic without reading DBF files.
Updated admin UI:Members sync now calls /sync/request/members
Dashboard has a sync status/control panel for members, payments, and billing.

Added env templates:backend/.env.development.example with DBF paths
backend/.env.production.example with SYNC_MODE=push_api and no DBF paths
frontend env examples

Added Server PC bridge contract doc at docs/server-pc-sync-contract.md.
Verification:
backend TypeScript no-emit check passed.
frontend production build passed.
Backend normal build was blocked by Windows EPERM on backend/dist; elevated run was declined.
Backend tests still fail due existing spec setup missing providers/repositories, unrelated to this refactor.
Frontend lint still fails on existing unrelated files; no new lint issue from the sync changes.
Note: backend/package-lock.json was already modified before my work, and docs/codex-plan.md is also untracked; I left both alone.