export default function SoaHeader() {
    return (
        <div className="relative px-4 md:px-6 pt-4 min-h-[100px] md:min-h-[120px]">
            <div className="pointer-events-none absolute left-1/2 top-4 w-full -translate-x-1/2 text-center">
                <div className="text-sm md:text-base font-bold tracking-wide text-slate-900">
                    THE PARKPLACE VILLAGE HOMEOWNERS' ASSOCIATION INC.
                </div>
                <div className="mt-1 text-xs text-slate-600">
                    Km. 23, E. Aguinaldo Highway Anabu 1, Imus, Cavite
                </div>
                <div
                    className="mt-4 md:mt-7 text-xl md:text-3xl font-extrabold uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-900"
                    style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}
                >
                    STATEMENT OF ACCOUNT
                </div>
            </div>
        </div>
    );
}
