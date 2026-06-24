# HOA Portal Security and Debugging Checklist

Purpose:
This document is used before deployment and before major updates to check if the portal has bugs, exposed sensitive data, weak permissions, or security issues.

## 1. Data Privacy Checks
- Homeowners must only see their own SOA, payments, water bill, and account data.
- Admin-only data must not appear in homeowner API responses.
- Passwords must never be returned by any API.
- Temporary passwords must not be visible after account creation/reset except in intended email flow.
- Other homeowners’ balances must not be accessible by changing accountId in the URL.

## 2. Role Permission Checks
- Homeowner cannot access admin routes.
- Admin cannot access super admin-only features if applicable.
- Backend must enforce role checks, not only frontend hiding.
- Sync buttons must be admin-only.

## 3. API Security Checks
- Test direct API calls with homeowner token.
- Check if accountId parameters can expose other accounts.
- Check if deleted/disabled users can still login.
- Check if expired JWT still works.
- Check if API errors expose stack traces or database details.

## 4. Sync Security Checks
- VPS must not read DBF directly.
- Sync endpoints must require API key/bearer token.
- Manual sync requests must require admin role.
- Prevent multiple overlapping sync jobs.
- Log failed sync attempts.

## 5. Production Environment Checks
- No DBF paths in VPS production .env.
- No debug logs showing sensitive data.
- No console logs exposing passwords, tokens, or SMTP credentials.
- NODE_ENV must be production.
- CORS must not allow everyone unless intentionally needed.

## 6. Frontend Checks
- No secret keys in frontend code.
- No hidden admin data in browser response.
- No sensitive info in localStorage except token if currently used.
- Logout clears token/session.

## 7. Database Checks
- Passwords are hashed.
- No plaintext password storage.
- User roles are correct.
- Account IDs are unique.
- Foreign keys/indexes are reviewed where needed.

## 8. Email Checks
- SMTP password is not committed to GitHub.
- Credential emails only go to the homeowner’s registered Gmail.
- Reset password emails do not expose unnecessary info.

## 9. Final Pre-Launch Tests
- Login as homeowner.
- Login as admin.
- Try accessing admin page as homeowner.
- Try changing accountId in URL/API.
- Verify SOA matches FoxPro.
- Verify payments match FoxPro.
- Verify billing matches FoxPro.
- Verify sync status works.