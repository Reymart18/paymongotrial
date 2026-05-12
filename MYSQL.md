CREATE USER 'hoa_user'@'localhost'
IDENTIFIED BY 'strongpassword';

GRANT ALL PRIVILEGES ON hoa_portal.* 
TO 'hoa_user'@'localhost';

FLUSH PRIVILEGES;

updated the overdue filter to use exactly “latest current charges × 12” when checking if the last balance equals 12 months. This also ensures the account reflects 12 months of no payments.

For example: if the latest current charge is 2,250, then 2,250 × 12 = 27,000. So an account with a last balance of 27,000 (or similar cases that match the 12-month no-payment condition) will be included, while a last balance of 6,750 will no longer be included.