updated the overdue filter to use exactly “latest current charges × 12” when checking if the last balance equals 12 months. This also ensures the account reflects 12 months of no payments.

For example: if the latest current charge is 2,250, then 2,250 × 12 = 27,000. So an account with a last balance of 27,000 (or similar cases that match the 12-month no-payment condition) will be included, while a last balance of 6,750 will no longer be included.

# Unpaid Accounts Counts
The “Unpaid Accounts” card is computed in the backend by checking each account’s Amount Due / Excess using the latest billing plus membership-dues payments in that billing window. If the result is positive, it counts as unpaid.

amountDue=(prinBal+intBal+penBal)+ (prinCurr+intCurr+penCurr)− membershipDuesPayments
If amountDue > 0 = Unpaid
If amountDue < 0 = Overpaid
If amountDue = 0, its neither

## percentage calculation
A percentage change formula measures how many times bigger or smaller something became compared to the old value.

Previous:       
138,045.39

Current:
2,233,140.89

Difference:
2,095,095.50

Now divide the increase by the old value:

2,095,095.50 divide 138,045.39
×100

That equals about 1517.7%.

## net collection 
IF amount due > 50
    => Include in Net Collection
ELSE
    => Consider Fully Paid

    Tolerance = ₱50

# net collection and total outstanding difference
The two numbers come from different datasets and rules:

Net Collection Report now includes only accounts with:
Amount Due>50
This excludes small balances and minor rounding differences, so the Net Collection total may be slightly lower.
Meanwhile, Total Outstanding (As of Today) includes all unpaid accounts from /admin/unpaid-accounts, including small balances and even cent-level differences.

so this is the formula of outstanding current charges (amount_due - previous_balance)

# total collectibles calculation
Compare Total Current Charges and Amount Due.
If Amount Due ≥ Total Current Charges, use Total Current Charges (no payment made this quarter).
If Amount Due < Total Current Charges, use Amount Due (partial payment made).
Grand total = sum of the selected value per account for the current quarter.