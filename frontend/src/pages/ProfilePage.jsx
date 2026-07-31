import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import avatarImg from '../images/avatar.png';
import HomeownerBottomNav from './components/HomeownerDashboard/HomeownerBottomNav';

const defaultPropertyDetails = {
    neighborhood: 'N/A',
    block: 'N/A',
    lot: 'N/A',
    memberName: 'N/A',
    propertySizeSqm: 'N/A',
    classification: 'N/A',
    goodStandingStatus: '',
    telno: 'N/A',
    celno: 'N/A',
};

function ContactRow({ label, value, iconPath }) {
    return (
        <div className="flex min-w-0 items-center gap-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#8C4100]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
                </svg>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{value || 'N/A'}</p>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const accountId = location.state?.accountId || localStorage.getItem('accountId') || 'N/A';
    const classification = location.state?.classification || 'LOT OWNER';
    const [propertyDetailsState, setPropertyDetailsState] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    let storedPropertyDetails = null;
    try {
        storedPropertyDetails = JSON.parse(localStorage.getItem('propertyDetails') || 'null');
    } catch {
        storedPropertyDetails = null;
    }

    const propertySource = {
        ...defaultPropertyDetails,
        ...(storedPropertyDetails || {}),
        ...(location.state?.propertyDetails || {}),
        ...(propertyDetailsState || {}),
    };

    const hasStoredStatus = Boolean(
        storedPropertyDetails?.goodStandingStatus
        && storedPropertyDetails.goodStandingStatus !== 'N/A',
    );

    const hasLocationStatus = Boolean(
        location.state?.propertyDetails?.goodStandingStatus
        && location.state.propertyDetails.goodStandingStatus !== 'N/A',
    );

    const hasStoredContactDetails = Boolean(
        storedPropertyDetails
        && Object.hasOwn(storedPropertyDetails, 'telno')
        && Object.hasOwn(storedPropertyDetails, 'celno'),
    );

    const hasLocationContactDetails = Boolean(
        location.state?.propertyDetails
        && Object.hasOwn(location.state.propertyDetails, 'telno')
        && Object.hasOwn(location.state.propertyDetails, 'celno'),
    );

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token || !storedAccountId) {
            navigate('/login');
            return;
        }

        if ((hasLocationStatus || hasStoredStatus) && (hasLocationContactDetails || hasStoredContactDetails)) {
            return;
        }

        const controller = new AbortController();

        const fetchAccount = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/property/account/${storedAccountId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('accountId');
                        localStorage.removeItem('propertyDetails');
                        navigate('/login');
                    }
                    return;
                }

                const nextDetails = {
                    neighborhood: data.neighborhood,
                    block: data.block,
                    lot: data.lot,
                    memberName: data.memberName,
                    propertySizeSqm: data.propertySizeSqm,
                    classification: data.classification,
                    goodStandingStatus: data.goodStandingStatus,
                    telno: data.telno || 'N/A',
                    celno: data.celno || 'N/A',
                };

                localStorage.setItem('propertyDetails', JSON.stringify(nextDetails));
                setPropertyDetailsState(nextDetails);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch account error:', err);
                }
            }
        };

        fetchAccount();

        return () => controller.abort();
    }, [
        API_URL,
        hasLocationContactDetails,
        hasLocationStatus,
        hasStoredContactDetails,
        hasStoredStatus,
        location.state,
        navigate,
        storedPropertyDetails,
    ]);

    const propertyDetails = [
        { label: 'Neighborhood', value: propertySource.neighborhood },
        { label: 'Block', value: propertySource.block },
        { label: 'Lot', value: propertySource.lot },
        { label: 'Member Name', value: propertySource.memberName },
        { label: 'Property Size (sqm)', value: propertySource.propertySizeSqm },
        { label: 'Telephone Number', value: propertySource.telno },
        { label: 'Cellphone Number', value: propertySource.celno },
        { label: 'Classification', value: propertySource.classification || classification },
        { label: 'Status', value: propertySource.goodStandingStatus || 'Loading...' },
    ];
    const isGoodStanding = propertySource.goodStandingStatus === 'In Good Standing';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 md:bg-white">
            <header className="bg-[#E89B58] md:mx-8 md:mt-4 md:rounded-2xl">
                <div className="flex items-center gap-3 px-4 py-4 md:gap-4 md:px-6 md:py-8">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        aria-label="Go back"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
                    >
                        <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-white md:text-xl md:tracking-wide">Profile Information</h1>
                        <p className="mt-0.5 text-xs text-orange-50 md:hidden">Your homeowner account details</p>
                    </div>
                </div>
            </header>

            <main className="w-full overflow-x-hidden pb-24 md:pb-0">
                <div className="mx-auto max-w-6xl px-4 py-5 md:px-18 md:py-10">
                    <section className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm md:rounded-2xl md:border-0 md:bg-[#E89B58]/30 md:p-7 md:shadow-none">
                        <div className="flex items-center gap-4 md:gap-5">
                            <img src={avatarImg} alt="Avatar" className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-orange-100 md:h-24 md:w-24 md:ring-0" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-lg font-extrabold text-slate-900 md:text-2xl md:text-[#8C4100]">
                                    {propertySource.memberName}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500 md:text-sm md:text-[#8C4100]">{accountId}</p>
                                <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${isGoodStanding ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {propertySource.goodStandingStatus || 'Loading status...'}
                                </span>
                            </div>
                        </div>
                    </section>

                    <div className="mt-5 space-y-4 md:hidden">
                        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-4 py-3">
                                <h2 className="text-sm font-bold text-slate-900">Property Location</h2>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-slate-100">
                                {[
                                    ['Neighborhood', propertySource.neighborhood],
                                    ['Block', propertySource.block],
                                    ['Lot', propertySource.lot],
                                ].map(([label, value]) => (
                                    <div key={label} className="min-w-0 px-2 py-4 text-center">
                                        <p className="text-[9px] font-bold uppercase text-slate-400">{label}</p>
                                        <p className="mt-1 break-words text-sm font-bold text-slate-800">{value || 'N/A'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
                            <div className="border-b border-slate-100 py-3">
                                <h2 className="text-sm font-bold text-slate-900">Contact Details</h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <ContactRow label="Cellphone Number" value={propertySource.celno} iconPath="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm3 15h4" />
                                <ContactRow label="Telephone Number" value={propertySource.telno} iconPath="M3 5a2 2 0 012-2h3l2 5-2 1a14 14 0 007 7l1-2 5 2v3a2 2 0 01-2 2C10.16 21 3 13.84 3 5z" />
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-900">Property Details</h2>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-slate-50 p-3">
                                    <p className="text-[9px] font-bold uppercase text-slate-400">Classification</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">{propertySource.classification || classification}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3">
                                    <p className="text-[9px] font-bold uppercase text-slate-400">Property Size</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">{propertySource.propertySizeSqm ?? 'N/A'} sqm</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mt-10 hidden md:block">
                        <h2 className="text-lg font-bold text-slate-900">PROPERTY DETAILS</h2>
                        <div className="mt-6 grid grid-cols-2 gap-12 lg:grid-cols-3">
                            {propertyDetails.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl bg-[#B4ADAD]/10 p-4 shadow-sm"
                                >
                                    <p className="line-clamp-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {item.label}
                                    </p>
                                    <p className="mt-2 wrap-break-words text-base font-semibold text-slate-900">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <HomeownerBottomNav />
        </div>
    );
}
