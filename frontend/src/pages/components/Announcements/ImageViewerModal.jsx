export default function ImageViewerModal({ image, onClose }) {
    if (!image) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                <img src={image} alt="Full view" className="w-full h-auto rounded-lg" />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition"
                    title="Close"
                >
                    <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
