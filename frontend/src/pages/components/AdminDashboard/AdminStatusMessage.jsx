export default function AdminStatusMessage({ message, variant, className }) {
    if (!message) {
        return null;
    }

    const baseClass =
        variant === 'error'
            ? 'rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700'
            : variant === 'success'
                ? 'rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-xs text-emerald-700'
                : 'rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-600';

    return <div className={`${baseClass}${className ? ` ${className}` : ''}`}>{message}</div>;
}
