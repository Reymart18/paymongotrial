export function getAdminRoleLabel(role = localStorage.getItem('userRole')) {
    return role === 'super_admin' ? 'SUPER ADMIN' : 'BOD';
}

export function getAdminDisplayName() {
    return localStorage.getItem('adminUsername')
        || localStorage.getItem('adminFullName')
        || getAdminRoleLabel();
}

export function clearAdminIdentity() {
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminFullName');
}
