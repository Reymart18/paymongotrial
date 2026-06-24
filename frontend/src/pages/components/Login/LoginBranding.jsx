import pvhaiImage from '../../../images/pvhai.png';

export default function LoginBranding() {
    return (
        <div className="text-center">
            <img src={pvhaiImage} alt="PVHAI" className="mx-auto h-40 w-auto" />
            <h2 className="mt-4 text-2xl font-medium font-abhaya text-white">Welcome!</h2>
            <p className="mt-2 text-sm font-poppins font-light text-white/80">
                A secure portal for homeowners to view announcements, manage dues, and access association services.
            </p>
        </div>
    );
}
