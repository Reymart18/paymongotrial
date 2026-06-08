import UploadCard from '../AdminDashboard/UploadCard';

const CarouselButton = ({ direction, onClick, title }) => (
    <button
        onClick={onClick}
        className={`absolute ${direction === 'previous' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 text-slate-700`}
        title={title}
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={direction === 'previous' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
            />
        </svg>
    </button>
);

const CardDots = ({ currentIndex, onChange, label }) => (
    <div className="flex items-center justify-center gap-2 mt-4">
        {[0, 1].map((index) => (
            <button
                key={index}
                onClick={() => onChange(index)}
                className={`w-2 h-2 rounded-full transition ${index === currentIndex ? 'bg-slate-900' : 'bg-slate-300'}`}
                title={`${label} Card ${index + 1}`}
            />
        ))}
    </div>
);

const UploadCarousel = ({ currentIndex, onPrevious, onNext, onChange, label, children }) => (
    <div className="relative flex flex-col items-center justify-center overflow-hidden">
        <CarouselButton direction="previous" onClick={onPrevious} title="Previous" />
        <div className="w-full flex items-center justify-center px-8">
            {children}
        </div>
        <CarouselButton direction="next" onClick={onNext} title="Next" />
        <CardDots currentIndex={currentIndex} onChange={onChange} label={label} />
    </div>
);

export default function ReportsDataTools({
    currentPaymentCardIndex,
    currentBillingCardIndex,
    onPrevPaymentCard,
    onNextPaymentCard,
    onSetCurrentPaymentCardIndex,
    onPrevBillingCard,
    onNextBillingCard,
    onSetCurrentBillingCardIndex,
    onSyncPayments,
    syncLoading,
    syncStatus,
    syncError,
    onUploadPayments,
    onPaymentFileChange,
    paymentLoading,
    paymentStatus,
    paymentError,
    onSyncBillings,
    billingSyncLoading,
    billingSyncStatus,
    billingSyncError,
    onUploadBillings,
    onBillingFileChange,
    billingLoading,
    billingStatus,
    billingError,
    onGenerateOverdue,
    overdueLoading,
    overdueError,
    overdueCount,
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <UploadCarousel
                currentIndex={currentPaymentCardIndex}
                onPrevious={onPrevPaymentCard}
                onNext={onNextPaymentCard}
                onChange={onSetCurrentPaymentCardIndex}
                label="Payment"
            >
                {currentPaymentCardIndex === 0 && (
                    <UploadCard
                        title="Sync FoxPro Payments (DBF)"
                        description="Manual sync from payments.DBF to update payment records."
                        onSubmit={onSyncPayments}
                        loading={syncLoading}
                        loadingLabel="Syncing..."
                        buttonLabel="SYNC"
                        status={syncStatus}
                        error={syncError}
                        showFileInput={false}
                    />
                )}
                {currentPaymentCardIndex === 1 && (
                    <UploadCard
                        title="Upload FoxPro Payments (DBF)"
                        onSubmit={onUploadPayments}
                        onFileChange={onPaymentFileChange}
                        loading={paymentLoading}
                        buttonLabel="Upload Payments"
                        status={paymentStatus}
                        error={paymentError}
                        inputAccept=".dbf"
                    />
                )}
            </UploadCarousel>

            <UploadCarousel
                currentIndex={currentBillingCardIndex}
                onPrevious={onPrevBillingCard}
                onNext={onNextBillingCard}
                onChange={onSetCurrentBillingCardIndex}
                label="Billing"
            >
                {currentBillingCardIndex === 0 && (
                    <UploadCard
                        title="Sync FoxPro Billings (DBF)"
                        description="Manual sync from BILLING.DBF to update billing records."
                        onSubmit={onSyncBillings}
                        loading={billingSyncLoading}
                        loadingLabel="Syncing..."
                        buttonLabel="SYNC"
                        status={billingSyncStatus}
                        error={billingSyncError}
                        showFileInput={false}
                    />
                )}
                {currentBillingCardIndex === 1 && (
                    <UploadCard
                        title="Upload FoxPro Billings (DBF)"
                        onSubmit={onUploadBillings}
                        onFileChange={onBillingFileChange}
                        loading={billingLoading}
                        buttonLabel="Upload Billings"
                        status={billingStatus}
                        error={billingError}
                        inputAccept=".dbf"
                    />
                )}
            </UploadCarousel>

            <div className="relative flex flex-col justify-center">
                <div className="relative rounded-2xl border border-slate-700 p-5 shadow-sm transition hover:shadow-md" style={{ backgroundColor: '#0E0E0E' }}>
                    <p className="text-xs text-slate-500 mb-3">
                        Disclaimer: Equivalent to 12 months' amount due.
                    </p>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">!</span>
                            <h3 className="text-sm font-medium text-white">Overdue Accounts</h3>
                        </div>
                        <button
                            onClick={onGenerateOverdue}
                            className="rounded-lg bg-white px-1 py-1 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
                            disabled={overdueLoading}
                        >
                            {overdueLoading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                    {overdueError && (
                        <div className="mt-3 rounded-lg border border-rose-400 bg-rose-900/30 px-3 py-2 text-[11px] text-rose-200">
                            {overdueError}
                        </div>
                    )}
                    <div className="mt-4 rounded-xl border border-slate-600 px-4 py-3" style={{ backgroundColor: '#1a1a1a' }}>
                        <p className="text-xs text-slate-400">Total accounts</p>
                        <p className="text-lg font-semibold text-white">
                            {overdueCount}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}



