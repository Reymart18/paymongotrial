CREATE USER 'hoa_user'@'localhost'
IDENTIFIED BY 'strongpassword';

GRANT ALL PRIVILEGES ON hoa_portal.* 
TO 'hoa_user'@'localhost';

FLUSH PRIVILEGES;

updated the overdue filter to use exactly “latest current charges × 12” when checking if the last balance equals 12 months. This also ensures the account reflects 12 months of no payments.

For example: if the latest current charge is 2,250, then 2,250 × 12 = 27,000. So an account with a last balance of 27,000 (or similar cases that match the 12-month no-payment condition) will be included, while a last balance of 6,750 will no longer be included.

#Unpaid Accounts Counts
The “Unpaid Accounts” card is computed in the backend by checking each account’s Amount Due / Excess using the latest billing plus membership-dues payments in that billing window. If the result is positive, it counts as unpaid.

amountDue=(prinBal+intBal+penBal)+ (prinCurr+intCurr+penCurr)− membershipDuesPayments
If amountDue > 0 = Unpaid
If amountDue < 0 = Overpaid
If amountDue = 0, its neither

##
payments collection doesnt calculated payment made by admin or pvhai to overall.