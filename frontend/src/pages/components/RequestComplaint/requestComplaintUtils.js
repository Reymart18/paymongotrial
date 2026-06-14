export const requestTypes = [
    'Gate Pass',
    'Move-in/Move-out Permit',
    'Maintenance Request',
    'Visitor Pass',
    'Other',
];

export const complaintTypes = [
    'Noise Complaint',
    'Parking Violation',
    'Pet Violation',
    'Security Concern',
    'Property Damage',
    'Other',
];

export const emptyRequestForm = {
    requestType: '',
    subject: '',
    description: '',
    preferredDate: '',
};

export const emptyComplaintForm = {
    complaintType: '',
    subject: '',
    description: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    evidence: null,
};

export function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export function requestReference(request) {
    const year = request.createdAt ? new Date(request.createdAt).getFullYear() : new Date().getFullYear();
    const prefix = request.submissionKind === 'complaint' ? 'CMP' : 'REQ';
    return `${prefix}-${year}-${String(request.id || 0).padStart(4, '0')}`;
}
