# PayMongo Online Payment Plan

## Goal

Add online payment to the HOA portal using PayMongo, while keeping FoxPro as the official accounting system.

## Main Rule

Members pay against the final SOA amount:

```text
Amount Due / Excess as of [due date]
```

They should not directly choose:

```text
Previous Balance only
Current Charges only
Principal
Interest
Penalties
```

The payment reduces the total computed amount due.

## Where To Put Pay Online

Add `Pay Online` in:

```text
SOA Preview
Homeowner Dashboard, optional
```

SOA Preview is the best place because the member can see the full computation before paying.

## Member Payment Flow

1. Member opens SOA Preview.
2. Member sees:

```text
Amount Due / Excess: PHP 7,583.70
```

3. Member clicks:

```text
Pay Online
```

4. Portal opens a modal:

```text
Amount Due: PHP 7,583.70

Pay Full Amount
Enter Custom Amount
```

5. Member chooses full amount or enters custom amount.
6. Member clicks:

```text
Continue to PayMongo
```

7. Portal creates a PayMongo checkout session.
8. Portal redirects member to PayMongo checkout page.
9. Member chooses payment method on PayMongo.

Possible PayMongo methods depend on the PayMongo account:

```text
GCash
Maya
GrabPay
Card
QR Ph
Online banking
```

10. Member completes payment.
11. PayMongo sends webhook to portal backend.
12. Backend verifies webhook.
13. Portal saves payment as paid in `online_payments`.
14. Portal immediately deducts the online payment from displayed SOA balance.

Important: the payment method is selected on the PayMongo checkout page, not inside the portal. The portal only chooses the amount and redirects to PayMongo.

## Online Payments Table

Create a separate table:

```text
online_payments
id
accountId
memberName
amount
status
paymongoCheckoutSessionId
paymongoPaymentId
paymongoReference
paymentMethod
billingPeriodLabel
paidAt
postedToFoxpro
postedToFoxproAt
foxproReferenceNumber
createdAt
updatedAt
```

## Statuses

Example statuses:

```text
pending
paid
failed
expired
posted_to_foxpro
```

Or keep posting separate:

```text
status = paid
postedToFoxpro = false
```

Then later:

```text
status = paid
postedToFoxpro = true
```

## SOA Calculation Rule

Before FoxPro posting:

```text
Amount Due =
Previous Balance
+ Current Charges
- FoxPro Payments
- Paid Online Payments where postedToFoxpro = false
```

After FoxPro posting and sync:

```text
Amount Due =
Previous Balance
+ Current Charges
- FoxPro Payments
```

Because the online payment becomes:

```text
postedToFoxpro = true
```

So it is no longer deducted separately. This avoids double deduction.

## Example Calculation

Before payment:

```text
Amount Due: PHP 7,583.70
```

Member pays online:

```text
PHP 3,000.00
```

Before FoxPro posting:

```text
Amount Due: PHP 4,583.70
```

Office posts in FoxPro, then sync happens.

FoxPro payment now exists:

```text
PHP 3,000.00
```

Online payment is marked:

```text
postedToFoxpro = true
```

Amount due stays:

```text
PHP 4,583.70
```

It does not become lower twice.

## SOA Payment Display

Before office posts to FoxPro:

```text
Payments

OR#              OR Date      Pay Cat          From-To                  Total
Online Payment   7/24/2026    Membership dues  Pending FoxPro posting   3,898.40
```

Better with reference:

```text
OR#              OR Date      Pay Cat          From-To                                  Total
Online Payment   7/24/2026    Membership dues  PAYMONGO PM-20260724-C002014-0001        3,898.40
```

After office posts to FoxPro and sync happens:

```text
Payments

OR#     OR Date      Pay Cat          From-To                                  Total
00518   7/24/2026    Membership dues  PAYMONGO PM-20260724-C002014-0001        3,898.40
```

## Office/FoxPro Posting Process

Example PayMongo payment:

```text
Account: C002014
Amount: PHP 3,898.40
PayMongo Ref: PM-20260724-C002014-0001
Payment Date: 07/24/2026
Payment Method: GCash
```

Office inputs into FoxPro:

```text
Account / HOA ID: C002014
OR#: 00518
OR Date: 07/24/2026
Pay Cat: Membership dues
From-To / Description: PAYMONGO PM-20260724-C002014-0001
Total: 3898.40
```

Important:

- Keep the official HOA OR# as the physical receipt number.
- Do not replace HOA OR# with PayMongo reference.
- Put PayMongo reference in `From-To`, `Description`, or `Remarks`.

## Why Not Use PayMongo Ref As OR#

If HOA physical receipts already have fixed OR numbers, use those OR numbers.

Example:

```text
OR#: 00518
Description: PAYMONGO PM-20260724-C002014-0001
```

This keeps:

- official HOA receipt sequence
- PayMongo tracking reference
- clean reconciliation

## Automatic Reconciliation

When FoxPro payments sync to portal:

1. Backend reads FoxPro payment description/from-to.
2. Detects PayMongo reference:

```text
PM-20260724-C002014-0001
```

3. Finds matching `online_payments` row.
4. Updates:

```text
postedToFoxpro = true
postedToFoxproAt = now
foxproReferenceNumber = 00518
```

5. SOA stops subtracting that online payment separately.
6. No double-counting happens.

## Admin Notification

When PayMongo payment succeeds:

- Admin gets a notification.
- Online payment appears in admin Online Payments page/report.
- Status initially:

```text
Paid - Pending FoxPro Posting
```

After FoxPro sync reconciliation:

```text
Posted to FoxPro
```

## Admin Online Payments Page

Add a page/report with:

```text
Account ID
Member Name
Amount
Payment Method
PayMongo Reference
Payment Date
Status
FoxPro OR#
Posted to FoxPro Date
```

Filters:

```text
Pending Posting
Posted to FoxPro
Date range
Account ID
Payment method
```

Actions:

```text
View details
Export PDF
Export Excel
```

Optional manual fallback:

```text
Mark as Posted to FoxPro
```

Automatic reconciliation is preferred.

## PayMongo Backend Integration

Use PayMongo Hosted Checkout.

Backend endpoints:

```text
POST /payments/paymongo/create-checkout
POST /payments/paymongo/webhook
GET /payments/self
GET /admin/online-payments
```

## Frontend Integration

Add:

```text
Pay Online button
Payment amount modal
Payment success page
Payment failed/cancelled page
Online payment status display
```

## Environment Variables

Backend `.env`:

```env
PAYMONGO_SECRET_KEY=sk_live_xxx
PAYMONGO_PUBLIC_KEY=pk_live_xxx
PAYMONGO_WEBHOOK_SECRET=xxx
PAYMONGO_SUCCESS_URL=https://parkplacevillage.cloud/homeowner/payment-success
PAYMONGO_FAILED_URL=https://parkplacevillage.cloud/homeowner/payment-failed
```

## Amount Format

PayMongo amount is sent in centavos.

```text
PHP 100.00 = 10000
PHP 7,583.70 = 758370
```

## Source Of Truth

Webhook is the source of truth.

Do not mark payment as paid just because the member lands on the success page.

Correct:

```text
PayMongo webhook says paid
backend marks payment paid
```

## Best First Version

Build this first:

```text
SOA Preview Pay Online
Full/custom amount
PayMongo Hosted Checkout
online_payments table
Webhook confirmation
SOA deducts paid unposted online payments
Admin notification
Admin online payments report
Automatic reconciliation by PayMongo reference in FoxPro description
```
