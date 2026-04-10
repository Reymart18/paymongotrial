export default function HomeownerStatusMessage({ message, variant, className }) {
    if (!message) {
        return null;
    }

    const baseClass =
        variant === 'error'
            ? 'rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700'
            : 'rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-600';

    return <div className={`${baseClass}${className ? ` ${className}` : ''}`}>{message}</div>;
}
