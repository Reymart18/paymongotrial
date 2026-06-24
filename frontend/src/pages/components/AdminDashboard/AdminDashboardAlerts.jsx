import AdminStatusMessage from './AdminStatusMessage';

export default function AdminDashboardAlerts({ messages }) {
    return (
        <>
            {messages.map((message) => (
                <AdminStatusMessage
                    key={message.key}
                    variant="error"
                    message={message.value}
                />
            ))}
        </>
    );
}
