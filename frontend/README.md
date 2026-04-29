# PV Hai Portal - Frontend

## Setup

```bash
npm create vite@latest frontend
cd frontend
npm install

npm install jspdf html2canvas
```

## Business Logic: Unpaid Accounts Calculation

### Purpose
The Admin Dashboard displays three key metrics, including **Unpaid Accounts** — a count of homeowner accounts with outstanding past-due balances (excluding current billing charges and overpayments).

### Rules for Counting Unpaid Accounts

An account is counted as **unpaid** when **ALL** of the following conditions are true:

1. **Current Billing Period Charges > 0**
   - The latest billing period in the system has charges due from the homeowner.
   - Example: 4/1/2026 - 6/30/2026 billing period has charges of ₱3,504.60

2. **Amount Due / Excess as of [Current Billing End Date] > 0**
   - The total amount owed (after all payments) is **positive** (not a credit/overpayment).
   - Calculated as: `Previous Unpaid Balance + Total Billing Charges for Year - Total Payments for Year`
   - Example: If the SOA shows "Amount Due / Excess as of 6/30/2026: ₱5,155.26" (positive), it qualifies.
   - Example: If the SOA shows "Amount Due / Excess as of 6/30/2026: -₱8,650.80" (negative), it does **NOT** qualify (indicates overpayment/credit).

3. **Amount Due > Current Billing Charges**
   - The total amount owed **exceeds** the current billing period charges.
   - This indicates past billing periods have unpaid balances.
   - **Comparison:**
     - ✅ Current charges: ₱3,485.11, Amount Due: ₱5,155.26 → **COUNT** (amount due is higher by ₱1,670.15, meaning past charges unpaid)
     - ❌ Current charges: ₱3,485.15, Amount Due: ₱3,485.15 → **DO NOT COUNT** (only current billing, fully matches)
     - ❌ Current charges: ₱3,504.60, Amount Due: -₱8,650.80 → **DO NOT COUNT** (negative, indicates overpayment/credit)

### Example Scenarios

**Scenario 1: Should Be Counted ✅**
```
Billing (2026):
- 1/1/2026 - 3/31/2026: ₱3,485.11
- 4/1/2026 - 6/30/2026: ₱3,485.11 (current)

Total Payments: ₱1,815.00
Amount Due / Excess as of 6/30/2026: ₱5,155.26

→ Current charges (₱3,485.11) < Amount Due (₱5,155.26) = UNPAID
→ Past billing charges (₱3,485.11 - ₱1,815.00 = ₱1,670.11) not fully paid
```

**Scenario 2: Should NOT Be Counted ❌**
```
Billing (2026):
- 1/1/2026 - 3/31/2026: ₱3,485.15 (current)

Total Payments: ₱0.00
Amount Due / Excess as of 3/31/2026: ₱3,485.15

→ Current charges (₱3,485.15) = Amount Due (₱3,485.15) = NOT UNPAID
→ Only current billing, no past charges unpaid
```

**Scenario 3: Should NOT Be Counted (Overpayment) ❌**
```
Billing (2026):
- 1/1/2026 - 3/31/2026: ₱3,504.60
- 4/1/2026 - 6/30/2026: ₱3,504.60 (current)

Total Payments: ₱15,660.00
Amount Due / Excess as of 6/30/2026: -₱8,650.80

→ Amount Due is NEGATIVE (overpayment/credit) = NOT UNPAID
→ Homeowner has already paid more than what is due
```

### Implementation Notes

- The **current billing period** is determined by finding the latest `dateTo` date in the billing records.
- Year selection is automatic based on the latest billing data available.
- Only positive balances (Amount Due > 0) are evaluated; negative balances (credit/overpayment) are excluded.
- The calculation aligns with the homeowner's **Statement of Account (SOA)** display.

---

## Reports Module (Quarterly)

### Purpose
The Reports module provides high-level, auditable quarter summaries for billing and collections. It is designed for business reporting and proposal-ready figures.

### Metrics

1. **Total Billed (This Quarter)**
   - Source: FoxPro billing uploads.
   - Calculation: Sum of `prinCurr + intCurr + penCurr` for billing rows whose `dateFrom` falls inside the selected quarter.

2. **Total Collected (This Quarter)**
   - Source: FoxPro payments uploads.
   - Calculation: Sum of `amountPaid` for payment rows whose `paymentDate` falls inside the selected quarter.

3. **Outstanding Balance**
   - Calculation: `Total Billed - Total Collected` for the selected quarter.

4. **Comparison %**
   - Each metric shows a % change compared to the **previous quarter**.
   - If the previous quarter total is 0, the comparison shows `N/A`.

### Quarter Selection
The UI allows selecting **Year + Quarter (Q1-Q4)**. The backend derives the quarter date range and aggregates billing/payment data accordingly.

---

## Legacy Notes

📄 Reports = “What actually happened?” Detailed Auditable Used for records, meetings, accounting In Reports (ALSO YES, more important there) In reports it becomes: Final official number Exportable (PDF/Excel) Used for comparison across quarters You can expand it there: Revenue breakdown Monthly breakdown Paid vs overdue contributions Trends

Net Collection (This Quarter)

✔ Works if:

positive → still need to collect
negative → over-collected

That percent was wrong because the previous quarter was negative (overpayment), and the formula was using abs(previous), which makes a negative baseline look like a small positive baseline.

I changed the logic so any previous value <= 0 returns N/A for the comparison. That matches your rule: negative means overpayment and should not be used for percent comparison.

Auto-syncs from payments.DBF every 60 seconds. Uses ORNO to prevent duplicates.

Use toast message

##autosync billing
It still applies. The interval controls how often the autosync checks the DBF’s last modified time. If the file hasn’t changed, it skips the actual sync, but the check still runs every 60 seconds. If you want fewer checks, increase the interval value. Very minimal. It only does a filesystem stat check every 60 seconds, not a DBF parse or DB write unless the file’s modified time changed. If you want to reduce even that small check, increase FOXPRO_BILLINGS_SYNC_INTERVAL_MS (e.g., 300000 for 5 minutes).

fix the tsconfig.json baseUrl error

break them into components