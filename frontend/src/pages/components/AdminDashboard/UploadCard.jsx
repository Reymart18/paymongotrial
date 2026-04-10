import AdminStatusMessage from './AdminStatusMessage';

export default function UploadCard({
    title,
    description,
    onSubmit,
    onFileChange,
    loading,
    buttonLabel,
    status,
    error,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 text-xs text-slate-500">{description}</p>
            <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-center gap-3">
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={onFileChange}
                    className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {loading ? 'Uploading...' : buttonLabel}
                </button>
            </form>
            {status && (
                <AdminStatusMessage
                    variant="success"
                    message={status}
                    className="mt-4"
                />
            )}
            {error && (
                <AdminStatusMessage
                    variant="error"
                    message={error}
                    className="mt-4"
                />
            )}
        </div>
    );
}
