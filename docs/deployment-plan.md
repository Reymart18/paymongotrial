We are deploying an HOA Portal that currently reads FoxPro DBF files during local development. The existing FoxPro system is already running on the office/server PC and must remain the source of truth.

DEPLOYMENT PLAN:

1. Existing FoxPro System
- The Visual FoxPro system already exists.
- Its DBF files are located only on the office/server PC.
- We will NOT modify the FoxPro system itself.
- We only need to read the DBF files externally.
- FoxPro DBF remains the official source of truth.

2. VPS Production Setup
The Hostinger VPS will contain:
- Backend API
- Frontend portal
- MySQL database

The VPS must NOT directly read DBF files.
The VPS must NOT use network paths like:
\\SERVER-PC\parkplacevillagesystem\payments.dbf

In production, the VPS only receives synced data and stores it in MySQL.

3. Sync Service on Server PC
We need to create a separate sync service running on the same server PC where FoxPro and DBF files exist.

The sync service will:
- Read DBF files locally
- Detect changes using polling or file modified timestamp
- Convert DBF records to JSON
- Send data to the VPS backend API using HTTPS/domain
- Use API key/token authentication
- Retry if internet or VPS request fails
- Log sync status and errors

Production sync direction:
Server PC -> VPS API -> MySQL -> Portal

NOT:
VPS -> Server PC DBF

4. Automatic Sync Flow
When a DBF file changes:

DBF file updated by FoxPro
→ Sync service detects change
→ Sync service reads DBF locally
→ Sync service sends JSON to VPS API
→ VPS backend updates MySQL
→ Portal displays updated data

This applies to:
- members.dbf
- payments.dbf
- billing.dbf

5. Manual Sync Button Flow
The portal will have manual buttons:
- Sync Members
- Sync Payments
- Sync Billing

Important: when admin clicks these buttons, the VPS still does NOT read DBF.

Manual sync works like this:

Admin clicks Sync Members / Sync Payments / Sync Billing
→ Frontend calls VPS backend endpoint
→ VPS creates a pending sync request in MySQL
→ Server PC sync service periodically checks VPS for pending sync requests
→ Server PC sees pending request
→ Server PC reads the correct local DBF file
→ Server PC sends data to VPS API
→ VPS updates MySQL
→ VPS marks sync request as completed

So the VPS acts as the middleman/message board.
The server PC understands the button was clicked because it polls the VPS for pending sync requests.

6. Suggested Sync Request Table
Create a table like sync_requests:

Fields:
- id
- type: members | payments | billing | full
- status: pending | processing | completed | failed
- requested_by
- requested_at
- started_at
- completed_at
- error_message
- records_processed
- records_updated

7. Suggested VPS API Endpoints

For portal/admin:
POST /sync/request/members
POST /sync/request/payments
POST /sync/request/billing

These create pending sync requests.

For server PC sync service:
GET /sync/requests/pending
POST /sync/requests/:id/start
POST /sync/requests/:id/complete
POST /sync/requests/:id/fail

For receiving actual synced data:
POST /sync/members
POST /sync/payments
POST /sync/billings

All server PC endpoints must require an API key or bearer token.

8. Environment Variables

Local Development Backend .env:
Can still keep DBF paths for localhost development/testing.

Example:
FOXPRO_PAYMENTS_DBF_PATH=\\SERVER-PC\parkplacevillagesystem\payments.dbf
FOXPRO_PAYMENTS_CUTOFF_DATE=2025-03-31
FOXPRO_BILLINGS_DBF_PATH=\\SERVER-PC\parkplacevillagesystem\billing.dbf
FOXPRO_BILLINGS_START_DATE=2026-01-01
FOXPRO_MEMBERS_DBF_PATH=\\SERVER-PC\parkplacevillagesystem\members.dbf
DB_HOST=localhost
DB_NAME=hoa_dev

Production VPS Backend .env:
Must NOT contain DBF paths.
Only keep MySQL, JWT, SMTP, app configs.

Example:
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=hoa_user
DB_PASS=strongpassword
DB_NAME=hoa_portal
JWT_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...

Server PC Sync Service .env:
This is where DBF paths belong in production.

Example:
MEMBERS_DBF=C:\parkplacevillagesystem\members.dbf
PAYMENTS_DBF=C:\parkplacevillagesystem\payments.dbf
BILLINGS_DBF=C:\parkplacevillagesystem\billing.dbf

PAYMENTS_CUTOFF_DATE=2025-03-31
BILLINGS_START_DATE=2026-01-01

API_BASE_URL=https://api.yourdomain.com
API_KEY=your_secret_key
SYNC_INTERVAL_SECONDS=5

9. Development vs Production
Keep both environments.

Development:
- Runs on localhost
- Used in VS Code
- Can directly read DBF for testing
- Uses local MySQL database
- Does not affect production

Production:
- Runs on Hostinger VPS
- Used by HOA admins/homeowners
- Does not read DBF directly
- Receives sync data from server PC sync service
- Uses production MySQL database

10. Deployment Workflow
For now, we may deploy directly to production VPS and allow internal HOA officers/admins to test before public launch.

Flow:
Develop locally
→ Test locally
→ Deploy to VPS
→ Internal testing on production domain
→ Fix errors
→ Official launch to homeowners

Do not immediately give access to all homeowners until officers/admins verify balances, SOA, payments, billing, members, login, and email.

11. Data Migration
Before production launch:
- Export existing local MySQL data if needed
- Import it into VPS MySQL
- Then run sync service for new/future updates

Cutoff/start dates are still useful and should live in the server PC sync service:
- PAYMENTS_CUTOFF_DATE
- BILLINGS_START_DATE

These prevent syncing unnecessary old records.

12. Important Safety Rules
- DBF files stay only on server PC.
- VPS never reads DBF.
- Do not expose DBF files over internet.
- Do not use SMB/network share paths in production VPS.
- Use HTTPS/domain, not raw IP.
- Use API key/token for sync endpoints.
- Prevent duplicate sync requests.
- Prevent overlapping sync jobs.
- Add logs.
- Add retry queue if internet fails.
- Add last sync status display in portal.

13. UI Requirements
Admin dashboard should show:
- Last sync time
- Sync status: online/offline/syncing/failed
- Last synced table
- Records updated
- Error message if failed

Manual buttons:
- Sync Members
- Sync Payments
- Sync Billing

Button behavior:
- If sync is already running, disable button or show "Sync in progress"
- After click, show "Sync requested"
- Then show status until completed/failed

14. Final Architecture Summary

AUTO SYNC:
FoxPro updates DBF
→ Server PC sync service detects change
→ Server PC sends data to VPS
→ VPS updates MySQL
→ Portal shows updated data

MANUAL SYNC:
Admin clicks sync button in portal
→ VPS creates pending sync request
→ Server PC sync service polls VPS
→ Server PC reads DBF locally
→ Server PC sends data to VPS
→ VPS updates MySQL
→ Request marked completed

FINAL RULE:
FoxPro = source of truth
Server PC sync service = bridge
VPS MySQL = online mirror
Portal = user interface

Please inspect the current codebase and help me refactor it toward this deployment plan without breaking localhost development. Keep development DBF reading usable locally, but production VPS must use push-sync receiving endpoints only.