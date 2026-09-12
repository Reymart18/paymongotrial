# Server PC Sync Service

This service runs on the office/server PC where FoxPro and the DBF files exist.

It reads DBF files locally and sends JSON to the portal API. The VPS never reads DBF files.

## 1. Install On The Server PC

Install these first:

1. Node.js 20 or newer.
2. A terminal: PowerShell or Command Prompt is fine.
3. Optional for always-on background running: NSSM or Windows Task Scheduler.

After installing Node.js, confirm:

```powershell
node -v
npm -v
```

## 2. Copy This Folder

Copy the whole `server-pc-sync-service` folder to the Server PC, for example:

```text
C:\hoa-sync-service
```

Then open PowerShell in that folder.

## 3. Install Dependencies

```powershell
npm install
```

This installs:

- `dbffile` for reading FoxPro DBF files
- `dotenv` for `.env` configuration

## 4. Create `.env`

Copy `.env.example` to `.env`.

```powershell
copy .env.example .env
```

Edit `.env`:

```env
MEMBERS_DBF=C:\parkplacevillagesystem\members.dbf
PAYMENTS_DBF=C:\parkplacevillagesystem\payments.dbf
BILLINGS_DBF=C:\parkplacevillagesystem\billing.dbf

PAYMENTS_CUTOFF_DATE=2025-03-31
BILLINGS_START_DATE=2026-01-01

API_BASE_URL=https://api.yourdomain.com
API_KEY=strongpassword

SYNC_INTERVAL_SECONDS=5
API_RETRY_ATTEMPTS=3
DBF_ENCODING=latin1

AUTO_SYNC_ENABLED=true
AUTO_SYNC_ON_START=false
STATE_FILE=state.json
```

For local portal testing, use:

```env
API_BASE_URL=http://localhost:3000
API_KEY=strongpassword
```

The `API_KEY` must match the portal backend `SYNC_API_KEY`.

## 5. Run A Syntax Check

```powershell
npm run check
```

## 6. Start The Service

```powershell
npm start
```

Leave the terminal open while testing.

The service will:

- poll `GET /sync/requests/pending`
- start pending jobs
- read the matching local DBF
- push JSON to `/sync/members`, `/sync/payments`, or `/sync/billings`
- complete or fail the sync request
- optionally auto-sync when DBF modified times change

## 7. Test Manual Sync

1. Start the portal backend.
2. Start the portal frontend.
3. Start this sync service.
4. Log in as admin.
5. Click `Sync Members`, `Sync Payments`, or `Sync Billing`.
6. Watch this service terminal for logs.

## 8. Auto Sync Behavior

`AUTO_SYNC_ENABLED=true` watches DBF modified timestamps.

`AUTO_SYNC_ON_START=false` means the first run only records current DBF timestamps. It will sync after the next DBF file change.

Set `AUTO_SYNC_ON_START=true` only if you want the first service start to push all configured DBF records immediately.

## 9. Run In Background Later

For production, run it as a Windows service or scheduled task after testing.

Recommended simple options:

- Windows Task Scheduler: run `npm start` at startup in this folder.
- NSSM: create a Windows service that runs Node with `src/index.js`.

Do foreground testing first before installing it as a background service.
