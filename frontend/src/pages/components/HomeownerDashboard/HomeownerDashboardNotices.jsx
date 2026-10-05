export default function HomeownerDashboardNotices({
    account,
    error,
    loading,
    overdueLoading,
    overdueNotice,
}) {
    return (
        <>
            {!loading && !error && account?.goodStandingStatus && (
                <div
                    className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2 text-sm ${account.goodStandingStatus === 'Not in Good Standing'
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        }`}
                >
                    {account.goodStandingStatus === 'Not in Good Standing' ? (
                        <span>
                            <span className="font-semibold">Status:</span>
                            {' '}
                            <span>Not in Good Standing. Due balance has reached 12+ months of billing charges.</span>
                        </span>
                    ) : (
                        <>
                            <span className="font-semibold">Status:</span>
                            <span>{account.goodStandingStatus}</span>
                        </>
                    )}
                </div>
            )}

            {!loading && !error && overdueNotice && !overdueLoading && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <div className="flex items-start gap-2">
                        <svg
                            className="mt-0.5 h-4 w-4 text-rose-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v3m0 4h.01M10.29 3.86l-7.4 12.84A2 2 0 004.6 20h14.8a2 2 0 001.71-3.3l-7.4-12.84a2 2 0 00-3.42 0z"
                            />
                        </svg>
                        <span>
                            You haven&apos;t paid for 12 months, and your total amount due is equivalent to or greater than 12 months billing charges. You will be listed for interest.
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
