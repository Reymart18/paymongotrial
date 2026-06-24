import StatusMessage from './components/SOAPreview/StatusMessage';
import WaterBillContent from './components/WaterPreview/WaterBillContent';
import WaterHeader from './components/WaterPreview/WaterHeader';
import WaterPreviewToolbar from './components/WaterPreview/WaterPreviewToolbar';
import useWaterPreviewController from './components/WaterPreview/useWaterPreviewController';
import headerImage from '../images/pvhai.png';

export default function WaterPreview() {
    const {
        accountId,
        error,
        formatDate,
        formatMoney,
        formatWholeNumber,
        handleBack,
        handleExportPdf,
        isExporting,
        loading,
        pdfRef,
        selectedBilling,
        selectedBillingId,
        setSelectedBillingId,
        waterBillings,
    } = useWaterPreviewController();

    const pageClassName = 'min-h-screen bg-slate-100 pb-8';
    const exportRootClassName =
        'relative mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-8 py-8 text-slate-900 shadow-sm md:px-12';
    const watermarkClassName =
        'pointer-events-none absolute left-1/2 top-1/2 hidden h-96 w-auto -translate-x-1/2 -translate-y-1/2 opacity-10 md:block';
    const dividerClassName = 'water-divider mx-auto mt-3 h-px w-11/12 bg-black';
    const hasNoBillingEntries = !loading && !error && !selectedBilling;
    const shouldShowBill = !loading && !error && selectedBilling;
    const showLoadingMessage = Boolean(loading);
    const showErrorMessage = Boolean(error);
    const selectedBillingValue = selectedBillingId;
    const billingsForSelector = waterBillings;
    const exportRootEnabled = true;

    return (
        <div className={pageClassName}>
            <WaterPreviewToolbar
                isExporting={isExporting}
                onBack={handleBack}
                onExportPdf={handleExportPdf}
                onSelectBilling={setSelectedBillingId}
                selectedBilling={selectedBilling}
                selectedBillingId={selectedBillingValue}
                waterBillings={billingsForSelector}
            />

            <div
                ref={pdfRef}
                data-export-root={exportRootEnabled}
                className={exportRootClassName}
            >
                <img
                    src={headerImage}
                    alt=""
                    aria-hidden="true"
                    className={watermarkClassName}
                />

                <WaterHeader />
                <div className={dividerClassName} />

                {showLoadingMessage && (
                    <StatusMessage
                        variant="loading"
                        message="Loading water billing preview..."
                    />
                )}

                {showErrorMessage && (
                    <StatusMessage
                        variant="error"
                        message={error}
                    />
                )}

                {hasNoBillingEntries && (
                    <StatusMessage
                        variant="info"
                        message="No water billing entries found."
                    />
                )}

                {shouldShowBill && (
                    <WaterBillContent
                        accountId={accountId}
                        formatDate={formatDate}
                        formatMoney={formatMoney}
                        formatWholeNumber={formatWholeNumber}
                        selectedBilling={selectedBilling}
                    />
                )}
            </div>
        </div>
    );
}
