# PayMongo Integration

This document describes the PayMongo trial implementation in `paymongotrial`. It is a handoff guide for applying the same integration to the main portal. It is not an executable script: the implementation agent should read it, inspect the target portal's existing account, statement, authentication, and database patterns, then adapt the file paths and entities.

## Overview

The portal uses PayMongo Hosted Checkout. The portal displays the homeowner's SOA amount, explains the payment-method fees, and then redirects the homeowner to PayMongo for payment-method selection and payment completion.

The PayMongo secret key stays in the backend environment. The frontend never receives the secret key.

## Current Payment Flow

1. The homeowner opens the SOA Preview page.
2. The portal loads the property account and statement using the authenticated session.
3. The portal calculates the displayed Amount Due / Excess from the account balance.
4. The homeowner clicks `Pay with PayMongo`.
5. The portal opens a pre-checkout modal containing the published PayMongo transaction-fee list and tax notice.
6. The homeowner clicks `Continue to PayMongo`.
7. The frontend calls the protected backend endpoint:

```text
POST /paymongo/checkout/:accountId
```

8. The backend verifies the account and the homeowner's ownership permission.
9. The backend reads the amount from the database account balance. It does not trust an amount supplied by the browser.
10. The backend creates a PayMongo Checkout Session through:

```text
POST https://api.paymongo.com/v2/checkout_sessions
```

11. The backend enables PayMongo fee pass-through with:

```json
"pass_on_fees": true
```

12. PayMongo returns a hosted `checkout_url`.
13. The backend returns that URL to the frontend.
14. The frontend redirects the browser to PayMongo Hosted Checkout.
15. PayMongo handles the available payment methods, fee calculation, payment form, and final confirmation screen.

## Online Payment Status Flow

When the checkout session is created successfully, the backend inserts an `online_payments` row for the account:

```text
status = UNDER_REVIEW
postedToFoxpro = false
```

The row is created directly as `UNDER_REVIEW` for this trial so it appears in the member's SOA immediately. The checkout session ID is stored so the later webhook can attach the confirmed PayMongo payment details to the exact member payment.

PayMongo sends the payment event to:

```text
POST /paymongo/webhook
```

The webhook:

1. Verifies the `Paymongo-Signature` header using the raw request body and `PAYMONGO_WEBHOOK_SECRET`.
2. Accepts the `checkout_session.payment.paid` event.
4. Finds the matching `online_payments` row by checkout session ID.
5. Stores the PayMongo payment ID, payment method, reference, and paid time.
6. Keeps the status as `UNDER_REVIEW`.

`UNDER_REVIEW` means PayMongo reports a successful customer payment, but the HOA has not yet posted the payment to FoxPro.

The generated temporary reference uses this format:

```text
ONLINE-YYYYMMDD-ACCOUNTID-00001
```

The webhook must be configured in the PayMongo Dashboard to point to the deployed backend's `/paymongo/webhook` URL. The webhook endpoint is intentionally not protected by the portal JWT guard; PayMongo authentication is provided by signature verification.

## Backend Files

```text
backend/src/paymongo/paymongo.module.ts
backend/src/paymongo/paymongo.controller.ts
backend/src/paymongo/paymongo.service.ts
backend/src/app.module.ts
```

### PayMongo Module

`PaymongoModule` registers the controller and service and provides access to `PropertyAccount` through TypeORM.

### Checkout Endpoint

```text
POST /paymongo/checkout/:accountId
Authorization: Bearer <portal JWT>
```

The endpoint:

- Requires JWT authentication.
- Looks up the account by `accountId`.
- Allows a homeowner to pay only their own account.
- Allows authorized non-homeowner roles according to the existing portal guards.
- Rejects missing accounts.
- Rejects zero or negative balances.
- Uses the database balance as the checkout amount.

### PayMongo Request

The backend sends a JSON:API-style request containing:

- Billing name
- HOA description
- One PHP line item, with the amount converted to centavos
- Account metadata
- `pass_on_fees: true`
- Enabled payment methods:
  - Card
  - GCash
  - GrabPay
  - Maya/PayMaya
  - QR Ph
- Success URL
- Cancel URL

The success and cancel URLs return to:

```text
http://localhost:5173/soa-preview/:accountId
```

The production `FRONTEND_URL` must replace the localhost URL in production.

## Frontend Files

```text
frontend/src/pages/SOAPreview.jsx
frontend/src/pages/components/SOAPreview/SummaryCard.jsx
frontend/src/pages/components/SOAPreview/useSOAPreviewController.js
```

### SOA Preview

`SOAPreview.jsx` passes the checkout handler and payment state into `SummaryCard`.

### Payment UI

`SummaryCard.jsx` contains:

- The `Pay with PayMongo` button beside Amount Due / Excess.
- The pre-checkout modal.
- The transaction-fee information.
- The tax notice.
- `Cancel` and `Continue to PayMongo` actions.
- Checkout error display.

The modal is informational. It does not calculate or alter the amount sent to PayMongo. PayMongo calculates the actual fee and final total in Hosted Checkout.

### Redirect Handler

`useSOAPreviewController.js` calls the backend endpoint and redirects to the returned `checkoutUrl` with:

```js
window.location.assign(data.checkoutUrl);
```

## Environment Variables

Backend `.env` requires:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=hoa_user
DB_PASS=your_database_password
DB_NAME=paymongotrial

PAYMONGO_SECRET_KEY=sk_test_your_test_key
PAYMONGO_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:5173
```

For production:

```env
PAYMONGO_SECRET_KEY=sk_live_your_live_key
PAYMONGO_WEBHOOK_SECRET=your_live_webhook_secret
FRONTEND_URL=https://your-production-frontend.example.com
```

Never put `PAYMONGO_SECRET_KEY` in frontend code or a `VITE_*` variable.

## Test Mode and Live Mode

A key beginning with `sk_test_` uses PayMongo test mode. Test mode should be used with PayMongo test credentials and should not be tested using real GoTyme, GCash, or other real wallet funds.

A key beginning with `sk_live_` creates live payment sessions. Live mode can charge real money and must only be enabled after the production safeguards are complete.

After changing keys or environment values, restart the backend. Always create a new Checkout Session when testing configuration changes; existing sessions keep their original settings.

## Fees and Taxes

The modal currently displays the configured informational fee list:

```text
GCash                         2.23%
Maya                          1.79%
Debit/Credit Cards (Local)   3.125% + PHP 13.39
Direct Online Banking        0.71% or PHP 13.39
QR Ph                         1.34%
```

The fee list is informational UI content. The backend does not calculate these percentages. The actual PayMongo fee and total are controlled by PayMongo Hosted Checkout and the PayMongo account configuration.

`pass_on_fees: true` requests that eligible PayMongo fees be passed to the payer. Whether the option is available and how fees or applicable taxes are displayed depends on the PayMongo account, environment, and payment method.

Do not describe the fee as a separate PVHAI tax unless the association's accountant confirms the tax treatment. The current modal says that applicable tax will be added to the transaction fee.

## SOA Temporary Payment Display

The statements service includes `UNDER_REVIEW` online payments for the matching account. It also includes older `PENDING` rows for backward compatibility with earlier local test records. New checkout rows use `UNDER_REVIEW` immediately.

They appear in the Payments table with:

```text
OR#: Online Payment
Pay Cat: Membership dues
From-To: UNDER_REVIEW · ONLINE-YYYYMMDD-ACCOUNTID-00001
Total: the online payment amount
```

These rows are display-only until FoxPro posting. `UNDER_REVIEW` means the online payment is associated with the member account and is awaiting HOA/FoxPro review or posting. Their amount is deliberately excluded from:

- The official running balance.
- The official `Total Payments` value.

This prevents a temporary PayMongo payment from changing the official FoxPro balance before the HOA posts it.

## Applying This to the Main Portal

When implementing this in another portal, use this document as the behavioral contract and adapt the local architecture:

1. Read the target portal's account entity and identify its stable member/account ID and current balance field.
2. Identify the existing statement service and payment-table response shape.
3. Add an `online_payments` entity with the account ID, amount, `UNDER_REVIEW` status, PayMongo checkout/payment IDs, reference, paid time, and FoxPro posting fields.
4. Register the entity with TypeORM and the PayMongo module.
5. Add a JWT-protected checkout endpoint that looks up the account server-side and creates a v2 PayMongo Checkout Session.
6. Add `pass_on_fees: true` and keep the PayMongo secret key server-side.
7. Save new checkout rows as `UNDER_REVIEW` and include the checkout-session ID.
8. Add a public webhook endpoint with raw-body signature verification using `PAYMONGO_WEBHOOK_SECRET`.
9. On `checkout_session.payment.paid`, update the matching row with PayMongo payment details.
10. Extend the statement service to return the matching online payment as a temporary row, but exclude it from official balance and payment-total calculations.
11. Add the SOA pre-checkout modal and redirect button, then verify the member/account authorization path.
12. Configure the target portal's local `.env`, restart the backend, and test with a new PayMongo test checkout.

Do not copy database names, account field names, JWT details, frontend URLs, or credentials blindly. Adapt those values to the main portal.

## Current Limitations

The following production features are not yet implemented:

- Idempotency and duplicate-payment protection.
- Automatic deduction of successful online payments from the SOA.
- Admin online-payment monitoring.
- FoxPro posting and reconciliation for online payments.
- Dedicated success and failed-payment pages.

The success URL currently returns to the SOA Preview, but a redirect alone must not be treated as proof of payment. Payment completion is confirmed by the verified PayMongo webhook, and the payment remains `UNDER_REVIEW` until FoxPro posting is implemented.

## Production Checklist

Before switching to a live key:

- Configure the production `FRONTEND_URL`.
- Use the production PayMongo secret key only in the backend environment.
- Confirm PayMongo v2 and `pass_on_fees` support for the live account.
- Confirm the displayed fee list against the PayMongo account pricing.
- Confirm the tax wording with the association's accountant.
- Implement and test webhook verification.
- Record successful, failed, cancelled, and expired checkout sessions.
- Add idempotency protection.
- Reconcile online payments with FoxPro before treating them as official HOA payments.
- Test with a small authorized live transaction before wider release.
