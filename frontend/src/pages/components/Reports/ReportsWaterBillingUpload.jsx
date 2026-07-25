import UploadCard from '../AdminDashboard/UploadCard';

export default function ReportsWaterBillingUpload({
    onUploadWaterBillings,
    onWaterBillingFileChange,
    waterBillingLoading,
    waterBillingStatus,
    waterBillingError,
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Water Billing Upload</h3>
                        <p className="text-xs text-slate-500">
                            Upload the water billing spreadsheet separately from FoxPro billing and payment tools.
                        </p>
                    </div>
                    <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                        XLS / XLSX / CSV
                    </span>
                </div>
            </div>
            <div className="bg-slate-50/70 px-5 py-5 md:px-6">
                <div className="mx-auto w-full max-w-xl">
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
            </div>
        </section>
    );
}
