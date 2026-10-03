-- Run this once after 20261003_add_portal_access_enabled.sql has already run.

ALTER TABLE property_account
    ADD COLUMN invitation_status VARCHAR(20) NOT NULL DEFAULT 'not_eligible',
    ADD COLUMN invitation_attempted_at DATETIME NULL,
    ADD COLUMN invitation_sent_at DATETIME NULL,
    ADD COLUMN invitation_error TEXT NULL,
    ADD COLUMN invitation_batch_id INT NULL;

CREATE TABLE member_invitation_batches (
    id INT NOT NULL AUTO_INCREMENT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_by VARCHAR(120) NULL,
    requested_count INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
