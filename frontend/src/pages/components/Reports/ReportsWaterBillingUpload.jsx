import UploadCard from '../AdminDashboard/UploadCard';

export default function ReportsWaterBillingUpload({
    onUploadWaterBillings,
    onWaterBillingFileChange,
    waterBillingLoading,
    waterBillingStatus,
    waterBillingError,
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Water Billing Upload</h3>
                <p className="text-xs text-slate-500">
                    Upload the water billing spreadsheet separately from FoxPro billing and payment tools.
                </p>
            </div>
            <div className="max-w-md">
                <UploadCard
                    title="Upload Water Billing (XLS/XLSX)"
                    description="Upload the water billing spreadsheet to create billing entries for matching accounts."
                    onSubmit={onUploadWaterBillings}
                    onFileChange={onWaterBillingFileChange}
                    loading={waterBillingLoading}
                    loadingLabel="Uploading..."
                    buttonLabel="Upload XLS"
                    status={waterBillingStatus}
                    error={waterBillingError}
                    inputAccept=".xls,.xlsx,.csv"
                />
            </div>
        </section>
    );
}
