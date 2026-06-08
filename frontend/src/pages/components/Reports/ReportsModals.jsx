import OverdueAccountsModal from './OverdueAccountsModal';
import OutstandingAccountsModal from './OutstandingAccountsModal';
import QuarterDueModal from './QuarterDueModal';

export default function ReportsModals({ overdue, outstanding, quarterDue }) {
    return (
        <>
            {overdue.open && <OverdueAccountsModal {...overdue} />}
            {outstanding.open && <OutstandingAccountsModal {...outstanding} />}
            {quarterDue.open && <QuarterDueModal {...quarterDue} />}
        </>
    );
}
