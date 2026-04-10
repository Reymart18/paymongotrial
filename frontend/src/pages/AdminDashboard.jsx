import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountsTable from './components/AdminDashboard/AccountsTable';
import AdminIntroCard from './components/AdminDashboard/AdminIntroCard';
import AdminNav from './components/AdminDashboard/AdminNav';
import UploadCard from './components/AdminDashboard/UploadCard';

export default function AdminDashboard() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [billingFile, setBillingFile] = useState(null);
    const [billingStatus, setBillingStatus] = useState('');
    const [billingError, setBillingError] = useState('');
    const [billingLoading, setBillingLoading] = useState(false);
    const [masterlistFile, setMasterlistFile] = useState(null);
    const [masterlistStatus, setMasterlistStatus] = useState('');
    const [masterlistError, setMasterlistError] = useState('');
    const [masterlistLoading, setMasterlistLoading] = useState(false);
    const [expandedStatementAccountId, setExpandedStatementAccountId] = useState(null);
    const [statementsByAccount, setStatementsByAccount] = useState({});
    const [statementsLoading, setStatementsLoading] = useState({});
    const [statementsError, setStatementsError] = useState({});
    const [editingAccountId, setEditingAccountId] = useState(null);
    const [editForm, setEditForm] = useState({
        memberName: '',
        propertySizeSqm: '',
        classification: '',
        status: '',
        balance: '',
        username: '',
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || role !== 'admin') {
            navigate('/login');
            return;
        }

        const controller = new AbortController();

        const fetchAccounts = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(`${API_URL}/admin/property-accounts`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        setError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        return;
                    }

                    setError(data.message || 'Failed to load homeowner accounts.');
                    return;
                }

                setAccounts(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch accounts error:', err);
                    setError('Failed to load homeowner accounts. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();

        return () => controller.abort();
    }, [API_URL, navigate]);

    const refreshAccounts = async (token) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/admin/property-accounts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    return;
                }

                setError(data.message || 'Failed to load homeowner accounts.');
                return;
            }

            setAccounts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Refresh accounts error:', err);
            setError('Failed to load homeowner accounts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const refreshAccountsWithRetry = (token) => {
        refreshAccounts(token);
        setTimeout(() => refreshAccounts(token), 800);
        setTimeout(() => refreshAccounts(token), 1800);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        navigate('/login');
    };

    const fetchStatements = async (accountId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setStatementsError((prev) => ({
                ...prev,
                [accountId]: 'Session expired. Please log in again.',
            }));
            return;
        }

        setStatementsLoading((prev) => ({ ...prev, [accountId]: true }));
        setStatementsError((prev) => ({ ...prev, [accountId]: '' }));

        try {
            const response = await fetch(`${API_URL}/statements/${accountId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setStatementsError((prev) => ({
                    ...prev,
                    [accountId]: data.message || 'Failed to load statement.',
                }));
                return;
            }

            setStatementsByAccount((prev) => ({
                ...prev,
                [accountId]: Array.isArray(data) ? data : [],
            }));
        } catch (err) {
            console.error('Fetch statements error:', err);
            setStatementsError((prev) => ({
                ...prev,
                [accountId]: 'Failed to load statement. Please try again.',
            }));
        } finally {
            setStatementsLoading((prev) => ({ ...prev, [accountId]: false }));
        }
    };

    const toggleStatements = (accountId) => {
        if (expandedStatementAccountId === accountId) {
            setExpandedStatementAccountId(null);
            return;
        }

        setExpandedStatementAccountId(accountId);

        if (!statementsByAccount[accountId]) {
            fetchStatements(accountId);
        }
    };

    const startEditing = (account) => {
        setEditingAccountId(account.accountId);
        setEditError('');
        setEditStatus('');
        setEditForm({
            memberName: account.memberName || '',
            propertySizeSqm: account.propertySizeSqm ?? '',
            classification: account.classification || '',
            status: account.status || '',
            balance: account.balance ?? '',
            username: account.username || '',
        });
    };

    const cancelEditing = () => {
        setEditingAccountId(null);
        setEditError('');
        setEditStatus('');
    };

    const handleEditChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveEdit = async (accountId) => {
        setEditError('');
        setEditStatus('');

        const token = localStorage.getItem('token');
        if (!token) {
            setEditError('Session expired. Please log in again.');
            return;
        }

        setEditLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/property-accounts/${accountId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    memberName: editForm.memberName,
                    propertySizeSqm: editForm.propertySizeSqm,
                    classification: editForm.classification,
                    status: editForm.status,
                    balance: editForm.balance,
                    username: editForm.username,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setEditError(data.message || 'Update failed. Please try again.');
                return;
            }

            setEditStatus('Account updated.');
            await refreshAccounts(token);
            setEditingAccountId(null);
        } catch (err) {
            console.error('Update account error:', err);
            setEditError('Update failed. Please try again.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteAccount = async (accountId) => {
        const confirmed = window.confirm(
            `Delete property account ${accountId}? This will remove related billing and payment records.`,
        );
        if (!confirmed) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Session expired. Please log in again.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/property-accounts/${accountId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Delete failed. Please try again.');
                return;
            }

            await refreshAccounts(token);
        } catch (err) {
            console.error('Delete account error:', err);
            setError('Delete failed. Please try again.');
        }
    };

    const handleUploadPayments = async (event) => {
        event.preventDefault();
        setUploadStatus('');
        setUploadError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setUploadError('Session expired. Please log in again.');
            return;
        }

        if (!uploadFile) {
            setUploadError('Please choose a CSV or XLSX file first.');
            return;
        }

        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);

            const response = await fetch(`${API_URL}/foxpro/payments/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setUploadError(data.message || 'Upload failed. Please try again.');
                return;
            }

            setUploadStatus(
                `Upload complete: ${data.inserted} inserted, ${data.skipped} skipped.`,
            );

            refreshAccountsWithRetry(token);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleUploadBillings = async (event) => {
        event.preventDefault();
        setBillingStatus('');
        setBillingError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setBillingError('Session expired. Please log in again.');
            return;
        }

        if (!billingFile) {
            setBillingError('Please choose a CSV or XLSX file first.');
            return;
        }

        setBillingLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', billingFile);

            const response = await fetch(`${API_URL}/foxpro/billings/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setBillingError(data.message || 'Upload failed. Please try again.');
                return;
            }

            setBillingStatus(
                `Upload complete: ${data.inserted} inserted, ${data.skipped} skipped.`,
            );

            refreshAccountsWithRetry(token);
        } catch (err) {
            console.error('Billing upload error:', err);
            setBillingError('Upload failed. Please try again.');
        } finally {
            setBillingLoading(false);
        }
    };

    const handleUploadMasterlist = async (event) => {
        event.preventDefault();
        setMasterlistStatus('');
        setMasterlistError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setMasterlistError('Session expired. Please log in again.');
            return;
        }

        if (!masterlistFile) {
            setMasterlistError('Please choose a CSV or XLSX file first.');
            return;
        }

        setMasterlistLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', masterlistFile);

            const response = await fetch(`${API_URL}/admin/masterlist/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setMasterlistError(data.message || 'Upload failed. Please try again.');
                return;
            }

            setMasterlistStatus(
                `Upload complete: ${data.inserted} inserted, ${data.skipped} skipped.`,
            );

            refreshAccountsWithRetry(token);
        } catch (err) {
            console.error('Masterlist upload error:', err);
            setMasterlistError('Upload failed. Please try again.');
        } finally {
            setMasterlistLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <AdminNav onLogout={handleLogout} />

            <div className="space-y-6 px-6 py-8">
                <AdminIntroCard />

                <UploadCard
                    title="Upload FoxPro Payments (CSV/XLSX)"
                    description="Required headers: PAYDATE, AMTPAID, ORNO, PAYCAT, KEYSEARCH, APPLICABLE"
                    onSubmit={handleUploadPayments}
                    onFileChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    loading={uploadLoading}
                    buttonLabel="Upload Payments"
                    status={uploadStatus}
                    error={uploadError}
                />

                <UploadCard
                    title="Upload FoxPro Billings (CSV/XLSX)"
                    description="Required headers: BILLDATE, DATEFROM, DATETO, DUEDATE, PRINBAL, INTBAL, PENBAL, PRINCURR, INTCURR, PENCURR, KEYSEARCH"
                    onSubmit={handleUploadBillings}
                    onFileChange={(e) => setBillingFile(e.target.files?.[0] || null)}
                    loading={billingLoading}
                    buttonLabel="Upload Billings"
                    status={billingStatus}
                    error={billingError}
                />

                <UploadCard
                    title="Upload Masterlist (CSV/XLSX)"
                    description="Classification must be HOMEOWNER or LOT OWNER. Names with commas should be quoted."
                    onSubmit={handleUploadMasterlist}
                    onFileChange={(e) => setMasterlistFile(e.target.files?.[0] || null)}
                    loading={masterlistLoading}
                    buttonLabel="Upload Masterlist"
                    status={masterlistStatus}
                    error={masterlistError}
                />

                <AccountsTable
                    accounts={accounts}
                    loading={loading}
                    error={error}
                    expandedStatementAccountId={expandedStatementAccountId}
                    statementsByAccount={statementsByAccount}
                    statementsLoading={statementsLoading}
                    statementsError={statementsError}
                    editingAccountId={editingAccountId}
                    editForm={editForm}
                    editLoading={editLoading}
                    editStatus={editStatus}
                    editError={editError}
                    onToggleStatements={toggleStatements}
                    onPreviewSoa={(id) => navigate(`/soa-preview/${id}`)}
                    onStartEditing={startEditing}
                    onDeleteAccount={handleDeleteAccount}
                    onEditChange={handleEditChange}
                    onSaveEdit={handleSaveEdit}
                    onCancelEditing={cancelEditing}
                />
            </div>
        </div>
    );
}
