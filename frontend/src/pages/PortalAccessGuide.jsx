import { Link } from 'react-router-dom';
import pvhaiImage from '../images/pvhai.png';

const getPortalLink = () => {
    const configuredOrigin = import.meta.env.VITE_PORTAL_URL;
    return (configuredOrigin || window.location.origin).replace(/\/$/, '');
};

export default function PortalAccessGuide() {
    const portalLink = getPortalLink();

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
            <article className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 px-5 py-6 sm:px-8">
                    <div className="flex items-center gap-4">
                        <img src={pvhaiImage} alt="PVHAI" className="h-16 w-auto" />
                        <div>
                            <p className="text-xs font-semibold uppercase text-emerald-700">Members Guide</p>
                            <h1 className="mt-1 text-2xl font-bold text-slate-950">HOA Portal Access Guide</h1>
                        </div>
                    </div>
                </header>

                <div className="space-y-7 px-5 py-7 sm:px-8">
                    <section>
                        <h2 className="text-lg font-semibold">1. Submit Your Gmail Address</h2>
                        <p className="mt-2 leading-7 text-slate-600">
                            A Google Form will be sent to the homeowners' group chat. Please provide your current Gmail
                            address, as this will be used for your HOA Portal account and login verification.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold">2. Receive Your Account Credentials</h2>
                        <p className="mt-2 text-slate-600">You will receive an email containing:</p>
                        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-600">
                            <li>Portal Link: <a href={portalLink} className="font-medium text-indigo-600 underline">{portalLink}</a></li>
                            <li>Username / Account ID</li>
                            <li>Temporary Password</li>
                        </ul>
                        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                            <p className="font-semibold">Example:</p>
                            <p className="mt-2">Hello Sample Account,</p>
                            <p>Your HOA Portal account has been created.</p>
                            <p>Portal Link: {portalLink}</p>
                            <p>Username / Account ID: E010090</p>
                            <p>Temporary Password: da15d4470bcd</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold">3. Log In</h2>
                        <p className="mt-2 leading-7 text-slate-600">
                            Visit the portal link and enter your Username and Temporary Password.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold">4. Verify Using OTP</h2>
                        <p className="mt-2 leading-7 text-slate-600">
                            An OTP (One-Time Password) will be sent to your registered Gmail address. Enter the OTP to continue.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold">5. Change Your Password</h2>
                        <p className="mt-2 leading-7 text-slate-600">
                            Upon your first login, change your temporary password to a new password of your choice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold">6. Access the Portal</h2>
                        <p className="mt-2 text-slate-600">Once logged in, you can access:</p>
                        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-600">
                            <li>Homeowner Dashboard</li>
                            <li>Water Dashboard</li>
                            <li>View Statement of Account (SOA)</li>
                            <li>View Water Bill</li>
                            <li>Request and Complaint Form</li>
                            <li>HOA Announcements</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold">7. Log Out Securely</h2>
                        <p className="mt-2 leading-7 text-slate-600">
                            For your security, sign out when using a shared device.
                        </p>
                    </section>

                    <div className="border-t border-slate-200 pt-6">
                        <p className="text-sm text-slate-600">
                            For account concerns or login assistance, please contact the HOA Office.
                        </p>
                        <Link
                            to="/login"
                            className="mt-5 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
