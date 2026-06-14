import { useEffect, useState } from 'react';
import {
    emptyComplaintForm,
    emptyRequestForm,
    requestReference,
} from './requestComplaintUtils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function useResidentSubmissions() {
    const [activeView, setActiveView] = useState('services');
    const [requestForm, setRequestForm] = useState(emptyRequestForm);
    const [complaintForm, setComplaintForm] = useState(emptyComplaintForm);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [recentSubmissions, setRecentSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const controller = new AbortController();

        const loadSubmissions = async () => {
            setSubmissionsLoading(true);
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [requestsResponse, complaintsResponse] = await Promise.all([
                    fetch(`${API_URL}/service-requests/self`, { headers, signal: controller.signal }),
                    fetch(`${API_URL}/service-requests/complaints/self`, { headers, signal: controller.signal }),
                ]);
                const [requests, complaints] = await Promise.all([
                    requestsResponse.json(),
                    complaintsResponse.json(),
                ]);
                if (!requestsResponse.ok || !complaintsResponse.ok) {
                    throw new Error(requests.message || complaints.message || 'Failed to load submissions.');
                }
                const combined = [
                    ...(Array.isArray(requests) ? requests.map((item) => ({ ...item, submissionKind: 'request' })) : []),
                    ...(Array.isArray(complaints) ? complaints.map((item) => ({ ...item, submissionKind: 'complaint' })) : []),
                ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRecentSubmissions(combined);
            } catch (error) {
                if (error.name !== 'AbortError') setFormError(error.message || 'Failed to load submissions.');
            } finally {
                setSubmissionsLoading(false);
            }
        };

        loadSubmissions();
        return () => controller.abort();
    }, []);

    const handleRequestChange = (event) => {
        const { name, value } = event.target;
        setRequestForm((current) => ({ ...current, [name]: value }));
        setFormError('');
    };

    const handleComplaintChange = (event) => {
        const { name, value, files } = event.target;
        setComplaintForm((current) => ({ ...current, [name]: files ? files[0] || null : value }));
        setFormError('');
    };

    const handleRequestSubmit = async (event) => {
        event.preventDefault();
        const normalizedRequest = {
            requestType: requestForm.requestType,
            subject: requestForm.subject.trim(),
            description: requestForm.description.trim(),
            preferredDate: requestForm.preferredDate,
        };
        if (Object.values(normalizedRequest).some((value) => !value)) {
            setFormError('Please complete all request fields.');
            return;
        }

        setSubmitting(true);
        setFormError('');
        try {
            const response = await fetch(`${API_URL}/service-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(normalizedRequest),
            });
            const submission = await response.json();
            if (!response.ok) throw new Error(submission.message || 'Failed to submit request.');
            setRecentSubmissions((current) => [{ ...submission, submissionKind: 'request' }, ...current]);
            setRequestForm(emptyRequestForm);
            setSuccessMessage(`${requestReference(submission)} was submitted successfully.`);
            setActiveView('services');
        } catch (error) {
            setFormError(error.message || 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplaintSubmit = async (event) => {
        event.preventDefault();
        const requiredValues = [
            complaintForm.complaintType,
            complaintForm.subject.trim(),
            complaintForm.description.trim(),
            complaintForm.incidentDate,
            complaintForm.incidentTime,
            complaintForm.location.trim(),
        ];
        if (requiredValues.some((value) => !value)) {
            setFormError('Please complete all complaint fields.');
            return;
        }

        const formData = new FormData();
        formData.append('complaintType', complaintForm.complaintType);
        formData.append('subject', complaintForm.subject.trim());
        formData.append('description', complaintForm.description.trim());
        formData.append('incidentDate', complaintForm.incidentDate);
        formData.append('incidentTime', complaintForm.incidentTime);
        formData.append('location', complaintForm.location.trim());
        if (complaintForm.evidence) formData.append('evidence', complaintForm.evidence);

        setSubmitting(true);
        setFormError('');
        try {
            const response = await fetch(`${API_URL}/service-requests/complaints`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            const submission = await response.json();
            if (!response.ok) throw new Error(submission.message || 'Failed to submit complaint.');
            const complaint = { ...submission, submissionKind: 'complaint' };
            setRecentSubmissions((current) => [complaint, ...current]);
            setComplaintForm(emptyComplaintForm);
            setSuccessMessage(`${requestReference(complaint)} was submitted successfully.`);
            setActiveView('services');
        } catch (error) {
            setFormError(error.message || 'Failed to submit complaint.');
        } finally {
            setSubmitting(false);
        }
    };

    const openForm = (view) => {
        setSuccessMessage('');
        setFormError('');
        setActiveView(view);
    };

    return {
        activeView,
        apiUrl: API_URL,
        complaintForm,
        formError,
        recentSubmissions,
        requestForm,
        selectedSubmission,
        submissionsLoading,
        submitting,
        successMessage,
        today: new Date().toISOString().slice(0, 10),
        closeDetails: () => setSelectedSubmission(null),
        handleComplaintChange,
        handleComplaintSubmit,
        handleRequestChange,
        handleRequestSubmit,
        openComplaintForm: () => openForm('complaint-form'),
        openDetails: setSelectedSubmission,
        openRequestForm: () => openForm('request-form'),
        showServices: () => setActiveView('services'),
    };
}
