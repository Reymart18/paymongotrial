export default function LoginTabs({ loginType, onChange }) {
    const tabClassName = (type) =>
        `flex-1 whitespace-nowrap border-b-4 px-2 py-2 text-sm font-semibold transition ${loginType === type
            ? 'border-white text-white'
            : 'border-transparent text-white/60 hover:text-white'
        }`;

    return (
        <div className="mt-6 flex gap-2 border-b border-white/30 mx-auto w-full max-w-md px-2 sm:px-6">
            <button className={tabClassName('homeowner')} onClick={() => onChange('homeowner')}>
                Homeowner | Lotowner
            </button>
            <button className={tabClassName('admin')} onClick={() => onChange('admin')}>
                Admin
            </button>
        </div>
    );
}
