-- Run once against the production portal MySQL database.
-- Existing members will be required to accept the current agreement version
-- because these fields start as NULL.

ALTER TABLE property_account
    ADD COLUMN memberAgreementVersion VARCHAR(32) NULL,
    ADD COLUMN memberAgreementAcceptedAt DATETIME NULL;
