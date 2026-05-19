import AdminStatusMessage from './AdminStatusMessage';

export default function UploadCard({
    title,
    description,
    onSubmit,
    onFileChange,
    loading,
    buttonLabel,
    loadingLabel,
    status,
    error,
    showFileInput = true,
    inputAccept = '.csv,.xlsx,.xls',
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 text-center">{title}</h3>
            <p className="mt-2 text-xs text-slate-500 text-center">{description}</p>
            <form onSubmit={onSubmit} className="mt-4 flex flex-col items-center justify-center gap-3">
                {showFileInput && (
                    <input
                        type="file"
                        accept={inputAccept}
                        onChange={onFileChange}
                        className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    />
                )}
                <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: '#0E0E0E' }}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {loading ? (loadingLabel || 'Uploading...') : buttonLabel}
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
