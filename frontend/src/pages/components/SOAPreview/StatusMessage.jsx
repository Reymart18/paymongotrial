export default function StatusMessage({ message, variant }) {
    if (!message) {
        return null;
    }

    const baseClass = 'px-6 pt-6 text-sm';
    const variantClass =
        variant === 'error'
            ? 'text-rose-600'
            : 'font-medium text-indigo-600';

    return <div className={`${baseClass} ${variantClass}`}>{message}</div>;
}
