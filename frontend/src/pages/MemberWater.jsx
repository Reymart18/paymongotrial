import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cbIcon from '../images/cb.png';
import pbIcon from '../images/pb.png';
import toIcon from '../images/to.png';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import HomeownerBottomNav from './components/HomeownerDashboard/HomeownerBottomNav';
import HomeownerStatusMessage from './components/HomeownerDashboard/HomeownerStatusMessage';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import WaterBillHistory from './components/HomeownerDashboard/WaterBillHistory';

export default function MemberWater() {
    const [account, setAccount] = useState(null);
    const [waterBillings, setWaterBillings] = useState([]);
    const [latestWaterBill, setLatestWaterBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const accountId = localStorage.getItem('accountId') || '';

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token || !accountId) {
            navigate('/login');
            return;
        }

        const controller = new AbortController();

        const fetchWaterDashboard = async () => {
            setLoading(true);
            setError('');

            try {
                const [accountResponse, waterResponse] = await Promise.all([
                    fetch(`${API_URL}/property/account/${accountId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }),
                    fetch(`${API_URL}/water-bills/account/${accountId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }),
                ]);

                const accountData = await accountResponse.json();
                const waterData = await waterResponse.json();

                if (!accountResponse.ok) {
                    setError(accountData.message || 'Failed to load account details.');
                    return;
                }

                if (!waterResponse.ok) {
                    setError(waterData.message || 'Failed to load water billing details.');
                    return;
                }

                const rows = Array.isArray(waterData) ? waterData : [];
                setAccount(accountData);
                setWaterBillings(rows);
                setLatestWaterBill(rows[0] || null);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Water dashboard error:', err);
                    setError('Failed to load water dashboard. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchWaterDashboard();

        return () => controller.abort();
    }, [API_URL, accountId, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        localStorage.removeItem('mustChangePassword');
        localStorage.removeItem('propertyDetails');
        navigate('/login');
    };

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const cards = [
        {
            title: 'Previous Balance',
            value: latestWaterBill?.previousBalance,
            icon: pbIcon,
        },
        {
            title: 'Current Charges',
            value: latestWaterBill?.currentCharges,
            description: latestWaterBill?.billingPeriod || '',
            icon: cbIcon,
        },
        {
            title: 'Total Outstanding',
            value: latestWaterBill?.totalDue,
            icon: toIcon,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <Sidebar isOpen={false} />

            <DashboardNav
                onLogout={handleLogout}
                onProfile={() => navigate('/homeowner/profile')}
                accountId={accountId}
                classification={account?.classification || 'Loading...'}
            />
            <HomeownerBottomNav />

            <div className="flex flex-1 transition-all duration-300 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-8 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
                        {loading && (
                            <HomeownerStatusMessage variant="loading" message="Loading water dashboard..." />
                        )}

                        {error && <HomeownerStatusMessage variant="error" message={error} />}

                        {!loading && !error && (
                            <>
                                <div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Latest water billing summary for {account?.memberName || accountId}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                                    {cards.map((card) => (
                                        <div
                                            key={card.title}
                                            className="relative rounded-2xl p-6 pt-10 shadow-sm transition hover:shadow-md"
                                            style={{ backgroundColor: 'rgba(232, 155, 88, 0.32)' }}
                                        >
                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#E89B58]/33 bg-white shadow-md">
                                                    <img src={card.icon} alt="" className="h-7 w-7" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                                                <p className="mt-3 text-2xl font-bold text-slate-900">
                                                    PHP {formatMoney(card.value)}
                                                </p>
                                                {card.description && (
                                                    <p className="mt-2 text-xs font-medium text-slate-600">
                                                        {card.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!latestWaterBill && (
                                    <HomeownerStatusMessage
                                        variant="loading"
                                        message="No water billing record is available yet."
                                    />
                                )}

                                <WaterBillHistory
                                    accountId={accountId}
                                    waterBillings={waterBillings}
                                    onPreview={() => navigate(`/water-preview/${accountId}`)}
                                />
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
