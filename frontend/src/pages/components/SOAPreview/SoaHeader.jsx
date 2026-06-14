export default function SoaHeader() {
    return (
        <div className="relative min-h-[108px] px-5 pt-5 md:min-h-[120px] md:px-6 md:pt-4">
            <div className="pointer-events-none absolute left-1/2 top-4 w-full -translate-x-1/2 text-center">
                <div className="px-4 text-xs font-bold leading-5 tracking-wide text-slate-900 md:px-0 md:text-base">
                    THE PARKPLACE VILLAGE HOMEOWNERS' ASSOCIATION INC.
                </div>
                <div className="mt-1 px-4 text-[10px] leading-4 text-slate-600 md:px-0 md:text-xs">
                    Km. 23, E. Aguinaldo Highway Anabu 1, Imus, Cavite
                </div>
                <div
                    className="mt-4 px-3 text-lg font-extrabold uppercase leading-tight tracking-[0.18em] text-slate-900 md:mt-7 md:px-0 md:text-3xl md:tracking-[0.4em]"
                    style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}
                >
                    STATEMENT OF ACCOUNT
                </div>
            </div>
        </div>
    );
}
