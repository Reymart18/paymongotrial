import UploadCard from '../AdminDashboard/UploadCard';

export default function ReportsSoaUpload({
    onUploadSoa,
    onSoaFileChange,
    soaLoading,
    soaStatus,
    soaError,
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">SOA Number Upload</h3>
                        <p className="text-xs text-slate-500">
                            Upload SOA numbers for existing accounts using neighborhood, block, and lot.
                        </p>
                    </div>
                    <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        XLS / XLSX
                    </span>
                </div>
            </div>
            <div className="bg-slate-50/70 px-5 py-5 md:px-6">
                <div className="mx-auto w-full max-w-xl">
                    <UploadCard
                        title="Upload SOA Numbers (XLS/XLSX)"
                        description="Updates only the SOA number for matching accounts."
                        onSubmit={onUploadSoa}
                        onFileChange={onSoaFileChange}
                        loading={soaLoading}
                        loadingLabel="Uploading..."
                        buttonLabel="Upload XLS"
                        status={soaStatus}
                        error={soaError}
                        inputAccept=".xls,.xlsx"
                    />
                </div>
            </div>
        </section>
    );
}
