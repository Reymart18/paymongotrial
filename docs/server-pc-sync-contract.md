# Server PC Sync Service Contract

This portal is prepared for the deployment plan, and a starter Server PC sync service is available in `server-pc-sync-service/`.

Use that folder on the office/server PC where FoxPro and the DBF files exist.

## Production Rule

- FoxPro is the source of truth.
- The Server PC sync service is the bridge.
- VPS MySQL is the online mirror.
- The portal is the user interface.

The production VPS must use `SYNC_MODE=push_api` and must not contain DBF paths. DBF paths belong only in local development env files or in the future Server PC sync service env.

## Server PC Sync Service Env

```env
MEMBERS_DBF=C:\parkplacevillagesystem\members.dbf
PAYMENTS_DBF=C:\parkplacevillagesystem\payments.dbf
BILLINGS_DBF=C:\parkplacevillagesystem\billing.dbf
ADJUSTMENTS_DBF=C:\parkplacevillagesystem\adjustment.dbf
ADJUSTMENTS_START_DATE=2026-07-01
PAYMENTS_CUTOFF_DATE=2025-03-31
BILLINGS_START_DATE=2026-01-01
API_BASE_URL=https://api.yourdomain.com
API_KEY=strongpassword
SYNC_INTERVAL_SECONDS=5
```

## Authentication

All Server PC endpoints require either:

```http
Authorization: Bearer strongpassword
```

or:

```http
x-api-key: strongpassword
```

## Manual Sync Flow

1. Admin clicks a sync button in the portal.
2. Portal backend creates a `sync_requests` row.
3. Server PC sync service polls `GET /sync/requests/pending`.
4. Server PC sync service starts the job with `POST /sync/requests/:id/start`.
5. Server PC sync service reads the matching local DBF file.
6. Server PC sync service pushes JSON to the VPS.
7. Server PC sync service marks the request completed or failed.

## Endpoints

Portal/admin endpoints:

- `POST /sync/request/members`
- `POST /sync/request/payments`
- `POST /sync/request/billing`
- `POST /sync/request/adjustments`
- `GET /sync/status`

Server PC endpoints:

- `GET /sync/requests/pending`
- `POST /sync/requests/:id/start`
- `POST /sync/requests/:id/complete`
- `POST /sync/requests/:id/fail`
- `POST /sync/members`
- `POST /sync/payments`
- `POST /sync/billings`
- `POST /sync/adjustments`
- `POST /sync/adjustments/reconcile` (send the complete adjustment snapshot after all batches)

## JSON Payloads

Each receiving endpoint accepts either a raw array of records or:

```json
{
  "requestId": 1,
  "records": []
}
```

Members records:

```json
{
  "accountId": "A003005",
  "neighborhood": "A",
  "block": "003",
  "lot": "005",
  "memberName": "Dela Cruz, Juan",
  "propertySizeSqm": 120,
  "classification": "HOMEOWNER",
  "gmail": "member@example.com",
  "telno": "",
  "celno": ""
}
```

Payments records:

```json
{
  "accountId": "A003005",
  "paymentDate": "2026-07-08",
  "amountPaid": 1500,
  "description": "July dues",
  "paycat": "Membership Dues",
  "referenceNumber": "OR12345"
}
```

Billing records:

```json
{
  "accountId": "A003005",
  "billDate": "2026-07-08",
  "dateFrom": "2026-07-01",
  "dateTo": "2026-07-31",
  "dueDate": "2026-08-15",
  "prinBal": 0,
  "intBal": 0,
  "penBal": 0,
  "prinCurr": 1500,
  "intCurr": 0,
  "penCurr": 0,
  "duesRate": 10
}
```

Adjustment records:

Only these `adjustment.dbf` columns are sent and stored: `TRANSDATE`, `PRINCIPAL`,
`INTEREST`, `KEYSEARCH`, `MEMBERNAME`, and `PENALTY`.

Only adjustments dated on or after July 1, 2026 are imported. `TRANSDATE` values in
the `YYYYMMDD` format, such as `20260703`, are supported.

Adjustment amounts are signed: negative values reduce the Amount Due / Excess, and
positive values increase it.

After pushing all adjustment batches, the Server PC service must send the complete
snapshot to `/sync/adjustments/reconcile`. The portal removes adjustment rows dated
on or after July 1, 2026 that are no longer present in that snapshot, then
recalculates affected balances.

```json
{
  "transDate": "2026-07-08",
  "principal": 1500,
  "interest": 0,
  "accountId": "A003005",
  "memberName": "Dela Cruz, Juan",
  "penalty": 0
}
```

Complete request body:

```json
{
  "recordsProcessed": 100,
  "recordsUpdated": 25
}
```

Fail request body:

```json
{
  "errorMessage": "Unable to read local DBF file.",
  "recordsProcessed": 0,
  "recordsUpdated": 0
}
```
