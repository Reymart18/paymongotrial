export default function ServiceOverview({ loading, requestCount, complaintCount }) {
    return (
        <section
            className="overflow-hidden rounded-lg border px-6 py-8 shadow-lg md:flex md:min-h-56 md:items-center md:justify-between md:px-10 md:py-10"
            style={{
                backgroundColor: '#145f46',
                borderColor: '#0d4b37',
                color: '#ffffff',
                boxShadow: '0 12px 28px rgba(13, 75, 55, 0.18)',
            }}
        >
            <div>
                <p className="text-xs font-bold uppercase" style={{ color: '#b8f3d8' }}>Resident Services</p>
                <h2 className="mt-3 text-2xl font-bold md:text-3xl" style={{ color: '#ffffff' }}>Requests & Complaints</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: '#d9f7e8' }}>
                    Review submissions, investigate concerns, and track resolved cases.
                </p>
            </div>
            <div
                className="mt-7 flex gap-10 border-t pt-7 md:mt-0 md:gap-12 md:border-l md:border-t-0 md:pl-10 md:pt-0"
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
                <div>
                    <p className="text-xs font-semibold" style={{ color: '#b8f3d8' }}>Total Requests</p>
                    <p className="mt-2 text-3xl font-bold" style={{ color: '#ffffff' }}>{loading ? '-' : requestCount}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold" style={{ color: '#b8f3d8' }}>Total Complaints</p>
                    <p className="mt-2 text-3xl font-bold" style={{ color: '#ffffff' }}>{loading ? '-' : complaintCount}</p>
                </div>
            </div>
        </section>
    );
}
