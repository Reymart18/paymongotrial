import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import avatarImg from '../images/avatar.png';

const profileDetails = [
    { label: 'Account ID', value: '' },
    { label: 'Classification', value: '' },
];

const defaultPropertyDetails = {
    neighborhood: 'N/A',
    block: 'N/A',
    lot: 'N/A',
    memberName: 'N/A',
    propertySizeSqm: 'N/A',
    classification: 'N/A',
};

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

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token || !storedAccountId) {
            navigate('/login');
            return;
        }

        if (location.state?.propertyDetails || storedPropertyDetails) {
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
    }, [API_URL, location.state, navigate, storedPropertyDetails]);

    const propertyDetails = [
        { label: 'Neighborhood', value: propertySource.neighborhood },
        { label: 'Block', value: propertySource.block },
        { label: 'Lot', value: propertySource.lot },
        { label: 'Member Name', value: propertySource.memberName },
        { label: 'Property Size (sqm)', value: propertySource.propertySizeSqm },
        { label: 'Classification', value: propertySource.classification || classification },
    ];

    const profileInfo = profileDetails.map((item) => {
        if (item.label === 'Account ID') {
            return { ...item, value: accountId };
        }
        if (item.label === 'Classification') {
            return { ...item, value: classification };
        }
        return item;
    });

    return (
        <div className="min-h-screen text-slate-900">
            <header className="mx-2 md:mx-8 mt-2 md:mt-4 rounded-xl md:rounded-2xl bg-[#E89B58]">
                <div className="px-2 md:px-6 py-3 md:py-8 flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex-shrink-0 text-white hover:opacity-80 transition"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="flex-1 text-base md:text-xl font-bold tracking-tight md:tracking-wide text-white line-clamp-1">PROFILE INFORMATION</h1>
                </div>
            </header>

            <main className="w-full bg-white overflow-x-hidden">
                <div className="mx-auto max-w-6xl px-2 md:px-18 py-4 md:py-10">
                    <div className="rounded-xl md:rounded-2xl bg-[#E89B58]/30 p-2 md:p-7">
                        <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-center justify-center md:justify-start text-center md:text-left">
                            <img src={avatarImg} alt="Avatar" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="mb-3 md:mb-4">
                                    <p className="text-base md:text-2xl font-extrabold text-[#8C4100] truncate">{accountId}</p>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-semibold text-[#8C4100]">{classification}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 md:mt-10">
                        <h2 className="text-base md:text-lg font-bold text-slate-900">PROPERTY DETAILS</h2>
                        <div className="mt-3 md:mt-6 grid gap-3 md:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {propertyDetails.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl md:rounded-2xl bg-[#B4ADAD]/10 p-2 md:p-4 shadow-sm"
                                >
                                    <p className="text-[7px] md:text-xs font-semibold uppercase tracking-none md:tracking-wide text-slate-500 line-clamp-2">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 md:mt-2 text-xs md:text-base font-semibold text-slate-900 break-words">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
