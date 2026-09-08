-- Run this once in the production hoa_portal MySQL database.
-- Re-running it replaces the prior version of this trigger.

DROP TRIGGER IF EXISTS after_delete_foxpro_adjustments;

DELIMITER //

CREATE TRIGGER after_delete_foxpro_adjustments
AFTER DELETE ON foxpro_adjustments
FOR EACH ROW
BEGIN
    UPDATE property_account
    SET balance =
        COALESCE((
            SELECT SUM(
                COALESCE(billing.prinBal, 0)
                + COALESCE(billing.intBal, 0)
                + COALESCE(billing.penBal, 0)
                + COALESCE(billing.prinCurr, 0)
                + COALESCE(billing.intCurr, 0)
                + COALESCE(billing.penCurr, 0)
            )
            FROM foxpro_billings AS billing
            WHERE BINARY billing.accountId = BINARY OLD.accountId
        ), 0)
        - COALESCE((
            SELECT SUM(COALESCE(payment.amountPaid, 0))
            FROM foxpro_payments AS payment
            WHERE BINARY payment.accountId = BINARY OLD.accountId
              AND (
                  payment.isDeletedFromFoxpro = 0
                  OR payment.isDeletedFromFoxpro IS NULL
              )
        ), 0)
        + COALESCE((
            SELECT SUM(
                COALESCE(adjustment.principal, 0)
                + COALESCE(adjustment.interest, 0)
                + COALESCE(adjustment.penalty, 0)
            )
            FROM foxpro_adjustments AS adjustment
            WHERE BINARY adjustment.accountId = BINARY OLD.accountId
        ), 0)
    WHERE BINARY accountId = BINARY OLD.accountId;
END//

DELIMITER ;
