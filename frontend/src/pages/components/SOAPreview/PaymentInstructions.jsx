export default function PaymentInstructions() {
    return (
        <div className="mx-auto mt-7 max-w-265 px-4 pb-7 text-[11px] leading-5 text-slate-900 md:mt-6 md:px-0 md:pb-0 md:text-xs md:leading-normal">
            <div className="font-semibold">
                You may send your payment thru bank account:
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-[140px,1fr] gap-y-1">
                <div className="text-slate-500">Bank:</div>
                <div>BPI Anabu II Branch, Imus City, Cavite</div>
                <div className="text-slate-500">Account Name:</div>
                <div>The Parkplace Village Homeowners' Assosciation Inc.</div>
                <div className="text-slate-500">Account Type:</div>
                <div>Current</div>
                <div className="text-slate-500">Account Number:</div>
                <div>0951-8890-67</div>
            </div>
            <div className="mt-4 text-slate-600">
                For more inquiries, please contact the PVHAI landline and email at
            </div>
            <div className="mt-1">
                (046) 484-2107 or (046-) 8754674
            </div>
            <div className="mt-1 soa-contact-email">theparkplacevillagehoa@gmail.com</div>
        </div>
    );
}
