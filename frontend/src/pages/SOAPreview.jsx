import AccountInfo from './components/SOAPreview/AccountInfo';
import PaymentInstructions from './components/SOAPreview/PaymentInstructions';
import SOAPreviewToolbar from './components/SOAPreview/SOAPreviewToolbar';
import SoaHeader from './components/SOAPreview/SoaHeader';
import StatusMessage from './components/SOAPreview/StatusMessage';
import SummaryCard from './components/SOAPreview/SummaryCard';
import useSOAPreviewController from './components/SOAPreview/useSOAPreviewController';
import headerImage from '../images/pvhai.png';

export default function SOAPreview() {
    const {
        account,
        accountId,
        amountDue,
        amountDueAsOfLabel,
        balanceAsOfLabel,
        balanceBreakdown,
        currentChargesBreakdown,
        currentChargesLabel,
        dueDate,
        duesRate,
        error,
        formatDate,
        formatMoney,
        formatSignedMoney,
        handleBack,
        handleExportPdf,
        handlePayOnline,
        isExporting,
        isPaying,
        latestBillDate,
        loading,
        lotSizeLabel,
        paymentRows,
        paymentError,
        pdfRef,
        selectedBillingYear,
        soaPrefix,
        soaValueLabel,
        totalPayments,
    } = useSOAPreviewController();
    const pageClassName = 'min-h-screen w-full bg-white text-slate-900';
    const exportRootClassName = 'relative min-h-screen w-full bg-white text-slate-900';
    const watermarkClassName =
        'pointer-events-none absolute left-1/2 top-1/2 h-75 md:h-112.5 w-auto -translate-x-1/2 -translate-y-1/2 opacity-10 hidden md:block';
    const dividerClassName = 'soa-divider mx-auto mt-3 h-px w-11/12 md:w-4/5 bg-black';
    const shouldShowContent = !loading && !error;

    return (
        <div className={pageClassName}>
            <SOAPreviewToolbar
                isExporting={isExporting}
                onBack={handleBack}
                onExportPdf={handleExportPdf}
            />

            <div
                ref={pdfRef}
                data-export-root="true"
                className={exportRootClassName}
            >
                <img
                    src={headerImage}
                    alt=""
                    aria-hidden="true"
                    className={watermarkClassName}
                />

                <SoaHeader />
                <div className={dividerClassName} />

                {loading && (
                    <StatusMessage
                        variant="loading"
                        message="Loading SOA preview..."
                    />
                )}

                {error && (
                    <StatusMessage
                        variant="error"
                        message={error}
                    />
                )}

                {shouldShowContent && (
                    <>
                        <AccountInfo
                            account={account}
                            accountId={accountId}
                            lotSizeLabel={lotSizeLabel}
                            soaPrefix={soaPrefix}
                            soaValueLabel={soaValueLabel}
                            billingDate={latestBillDate}
                            dueDate={dueDate}
                            duesRate={duesRate}
                            formatDate={formatDate}
                        />

                        <SummaryCard
                            selectedBillingYear={selectedBillingYear}
                            formatDate={formatDate}
                            formatMoney={formatMoney}
                            balanceAsOfLabel={balanceAsOfLabel}
                            currentChargesLabel={currentChargesLabel}
                            balanceBreakdown={balanceBreakdown}
                            currentChargesBreakdown={currentChargesBreakdown}
                            paymentRows={paymentRows}
                            totalPayments={totalPayments}
                            amountDue={amountDue}
                            amountDueAsOfLabel={amountDueAsOfLabel}
                            formatSignedMoney={formatSignedMoney}
                            onPayOnline={handlePayOnline}
                            isPaying={isPaying}
                            paymentError={paymentError}
                        />

                        <PaymentInstructions />
                    </>
                )}
            </div>
        </div>
    );
}
