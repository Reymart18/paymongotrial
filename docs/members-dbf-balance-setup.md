# MEMBERS.DBF Balance Setup

## Purpose

Use FoxPro's `MEMBERS.DBF` as the authoritative source of each member's current
**Amount Due / Excess**.

FoxPro automatically applies membership-dues payments and adjustments to the
member balance fields. The portal must mirror that final FoxPro balance instead
of calculating it again from transaction files.

## Authoritative Formula

For each member record:

```text
Amount Due / Excess = PRINCIPAL + INTEREST + PENALTY
```

Example:

```text
PRINCIPAL = 1,000.00
INTEREST  =   500.00
PENALTY   =    50.00
---------------------
Total     = 1,550.00
```

`1,550.00` is an amount due. A negative result is an excess/credit balance.

## File Responsibilities

| FoxPro file | Portal purpose | Use for Amount Due / Excess? |
| --- | --- | --- |
| `MEMBERS.DBF` | Member account data and final principal, interest, and penalty balances | Yes |
| `BILLING.DBF` | Billing periods, bill dates, due dates, and current-charge details | No |
| `PAYMENTS.DBF` | Payment history, receipts, reference numbers, and last-payment-date reports | No |

`ADJUSTMENT.DBF` is not part of the portal setup. Do **not** fetch it, store
it, display it, or create adjustment sync requests for it. Its effect is already
represented in the three `MEMBERS.DBF` balance fields.

Do **not** add billing charges again or subtract payments again. Those changes
are already represented in the three `MEMBERS.DBF` balance fields.

## Members Sync Payload

The Server-PC sync service must include these fields in every member record
sent to `POST /sync/members`:

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
  "celno": "",
  "principal": 1000,
  "interest": 500,
  "penalty": 50
}
```

The portal must store the three values with the member account and set its
stored total balance to their sum. It must accept zero as a valid value. A
missing/invalid balance value must not overwrite a previously valid balance.

## Sync Order

Run syncs in this order:

1. Sync `MEMBERS.DBF`.
   - Creates new portal accounts when needed.
   - Updates member information and principal, interest, penalty, and total
     balance.
   - An account may have a valid amount due even if its billing history has not
     yet been synced.
2. Sync `BILLING.DBF`.
   - Adds billing-period and due-date information for accounts that now exist.
3. Sync `PAYMENTS.DBF`.
   - Adds payment history only.

`ADJUSTMENT.DBF` has no portal sync step.

## Portal Rules

### Amount Due / Excess

Every display, dashboard card, account list, and report labelled **Amount Due /
Excess** must use:

```text
stored member principal + stored member interest + stored member penalty
```

The portal may alternatively use a stored `balance` value only if it is updated
solely from that same sum during the members sync.

This applies to **every consumer**, including:

- Admin dashboard summary counts and account modals
- Admin unpaid, overpaid, settled, and good-standing reports
- Reports-page overdue, outstanding, quarterly-due, and exported reports
- Homeowner dashboard cards and account summaries
- Members-page account balances
- SOA preview balance headers and Amount Due / Excess labels
- API responses used by any of the screens above

No screen, endpoint, helper, or report may independently calculate Amount Due /
Excess by combining billing rows, subtracting payment rows, or adding adjustment
rows. Any existing calculation that does so must be replaced with the members
balance.

### Billing Information

`BILLING.DBF` may still be used to display:

- Current billing period
- Billing date and due date
- Current billing charges
- Rules that compare total Amount Due with a current billing charge

It must not modify or recreate the final Amount Due / Excess total.

### Payment Information

`PAYMENTS.DBF` may still be used to display:

- Payment history
- Official receipt/reference number
- Payment description and category
- Last membership-dues payment date

Payment sync must not trigger balance recalculation or alter the balance stored
from `MEMBERS.DBF`.

### Statements and SOA

The payment/billing statement may continue to show its transaction history.
However, its locally reconstructed running total is not the authority for the
current Amount Due / Excess and must never overwrite the stored members balance.

The portal must not show adjustment rows in its statement history because
`ADJUSTMENT.DBF` is not synced or stored.

The SOA transaction history may still list billing and payment rows, but its
running balance must not replace the members balance. The SOA Amount Due /
Excess header must use the same members balance as the dashboards and reports.

## Historical Date Rule

The phrase `Amount Due / Excess as of 9/30/2026` is correct only when the
synced `MEMBERS.DBF` snapshot represents FoxPro's balances as of September 30,
2026.

This rule applies everywhere the label appears. Every dashboard, report, API
response, export, account list, SOA, and modal showing `Amount Due / Excess as
of [date]` must use the member-balance snapshot for that exact date. It must
not use a newer live balance, an older billing row, or a locally reconstructed
transaction total.

For later historical reports, retain a dated members-balance snapshot at each
reporting cutoff. Do not combine a newer live members balance with an older
billing-period label.

## Safe Rollout

1. Add the balance fields to the members sync payload and portal account storage.
2. Sync a known FoxPro snapshot, such as September 30, 2026.
3. Compare a representative sample of accounts in FoxPro and the portal:
   `PRINCIPAL + INTEREST + PENALTY` must match exactly.
4. Replace every independent Amount Due / Excess calculation in the backend and
   frontend with the member balance, including all dashboards, reports, API
   responses, exports, account lists, SOA previews, and homeowner summaries.
5. Stop recalculating balances after payment or billing imports.
6. Remove the Adjustment sync request, API endpoints, sender configuration,
   database entity, and admin sync button.
7. Keep existing payment and billing history data for their dedicated features.

There is no need to retain adjustment history in the portal. Remove the portal's
adjustment data and related code only after the members-based balance sync has
been verified in production.

## Validation Checklist

- [ ] The Server-PC members payload contains `principal`, `interest`, and `penalty`.
- [ ] A members sync saves all three values and their total.
- [ ] A positive total displays as Amount Due.
- [ ] A negative total displays as Excess/Credit.
- [ ] A zero total displays as settled.
- [ ] A payment sync does not change the stored members balance.
- [ ] An adjustment made in FoxPro is reflected after the next members sync,
      without any `ADJUSTMENT.DBF` portal sync.
- [ ] A member with no billing record can still display a valid Amount Due /
      Excess.
- [ ] Dashboard and report totals match the FoxPro member balances.
