import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import landingImage from '../images/Rectangle1.png';
import designImage from '../images/design.png';
import rectangleImage from '../images/Rectangle 5.png';
import aboutImage from '../images/about2.png';
import coverImage from '../images/cover.png';
import contactImage from '../images/contact1.png';
import phoneImage from '../images/phone.png';
import loginImage from '../images/login.png';
import bottomImage from '../images/bottom.png';

export default function LandingPage() {
    const navigate = useNavigate();

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const targetPosition = element.getBoundingClientRect().top + window.scrollY;
            const startPosition = window.scrollY;
            const distance = targetPosition - startPosition;
            const duration = 300; // 1.5 seconds for smooth scroll
            let start = null;

            const smoothScroll = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const percentage = Math.min(progress / duration, 1);

                // Easing function for smooth deceleration
                const easeInOutQuad = percentage < 0.5
                    ? 2 * percentage * percentage
                    : -1 + (4 - 2 * percentage) * percentage;

                window.scrollTo(0, startPosition + distance * easeInOutQuad);

                if (progress < duration) {
                    requestAnimationFrame(smoothScroll);
                }
            };

            requestAnimationFrame(smoothScroll);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        const scrollReveals = document.querySelectorAll('.scroll-reveal');
        scrollReveals.forEach((element) => {
            observer.observe(element);
        });

        return () => {
            scrollReveals.forEach((element) => {
                observer.unobserve(element);
            });
        };
    }, []);

    return (
        <>
            <div className="relative min-h-[70vh] w-full overflow-hidden bg-[#C49554] sm:min-h-screen" id="home">
                <div className="absolute left-1/2 top-4 z-10 flex w-[min(96vw,1100px)] -translate-x-1/2 items-center justify-between gap-1 text-[#363232] sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-4 text-xs font-abhaya sm:gap-10 sm:text-base md:justify-start md:gap-12 md:text-xl">
                        <button onClick={() => scrollToSection('home')} className="cursor-pointer hover:opacity-70 transition">Home</button>
                        <button onClick={() => scrollToSection('about')} className="cursor-pointer hover:opacity-70 transition">About</button>
                        <button onClick={() => scrollToSection('faq')} className="cursor-pointer hover:opacity-70 transition">FAQ</button>
                    </div>
                    <div className="relative -top-3 w-32 shrink-0 sm:-top-4 sm:w-50 md:w-60">
                        <img
                            src={rectangleImage}
                            alt=""
                            aria-hidden="true"
                            className="w-full"
                        />
                        <div className="absolute inset-0 flex items-start justify-center pt-2.5 sm:pt-4">
                            <span className="font-allison text-xl text-[white] sm:text-3xl md:text-4xl">
                                Parkplace Village
                            </span>
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-4 text-xs font-abhaya sm:gap-10 sm:text-base md:justify-end md:gap-12 md:text-xl">
                        <button onClick={() => scrollToSection('contacts')} className="cursor-pointer hover:opacity-70 transition">Contacts</button>
                        <button onClick={() => scrollToSection('location')} className="cursor-pointer hover:opacity-70 transition">Location</button>
                    </div>
                </div>
                <img
                    src={landingImage}
                    alt=""
                    aria-hidden="true"
                    className="h-[70vh] w-full object-cover object-[50%_center] opacity-35 sm:h-screen sm:object-center"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-[white]">
                    <h1 className="font-abhaya text-3xl font-medium sm:text-4xl md:text-5xl">
                        Explore Your HOA Community Home
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm font-poppins font-extralight sm:text-base md:text-lg">
                        A safe, organized, and welcoming community where every home feels connected and valued.
                    </p>
                    <div className="absolute bottom-20 left-0 z-20 w-32 overflow-hidden transition duration-300 hover:scale-105 hover:opacity-80 hover:shadow-lg cursor-pointer sm:w-40 md:w-55">
                        <img
                            src={loginImage}
                            alt="Login"
                            className="h-auto w-full"
                        />
                        <button
                            onClick={() => navigate('/login')}
                            className="absolute inset-0 flex items-center justify-center overflow-hidden text-xs font-poppins font-semibold text-[#363232] sm:text-lg">
                            <span className="login-slide-text absolute left-[45%] -translate-x-1/2 whitespace-nowrap sm:left-1/2">Login Here</span>
                            <span className="login-edge-arrow absolute right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#e45c13] text-[9px] text-white shadow-sm sm:right-4 sm:h-5 sm:w-5 sm:text-[10px] md:h-7 md:w-7 md:text-sm">
                                &gt;
                            </span>
                        </button>
                    </div>
                </div>
                <img
                    src={designImage}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-[-8%] left-1/2 w-[140vw] max-w-none -translate-x-1/2 sm:bottom-[-22%] sm:w-[120vw]"
                />
            </div>
            <section className="bg-[#F0E8E8] px-6 py-16 sm:px-10 lg:px-11" id="about">
                <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between scroll-reveal">
                    <div className="flex flex-col items-center gap-6 lg:w-1/2 lg:items-start">
                        <h2 className="font-abhaya text-4xl font-medium sm:text-5xl md:text-6xl text-[#363232]">
                            About the Community
                        </h2>
                        <p className="font-poppins text-base font-extralight leading-relaxed text-[#363232] sm:text-lg md:text-xl">
                            Discover <strong className="font-semibold">The Parkplace Village</strong>, a premier residential community in Anabu, Imus, Cavite. Enjoy comfortable living, thoughtfully planned spaces, and a welcoming neighborhood designed for families and modern lifestyles.
                        </p>
                    </div>
                    <div className="relative lg:w-5/12">
                        <img
                            src={coverImage}
                            alt=""
                            aria-hidden="true"
                            className="absolute -right-2 top-[-6%] z-0 w-40 sm:w-56 md:w-64"
                        />
                        <img
                            src={aboutImage}
                            alt="About the Community"
                            className="w-full rounded-tl-[80px] rounded-br-[100px] relative z-10"
                        />
                    </div>
                </div>
            </section>
            <section className="bg-[#FFFBFB] px-6 py-16 sm:px-10 lg:px-11" id="faq">
                <style>{`
                    #faq summary {
                        position: relative;
                        display: flex;
                        align-items: center;
                            justify-content: space-between;
                        min-height: 1.5rem;
                        padding: 0 2.5rem;
                            text-align: left;
                    }
                    #faq summary::after {
                        content: '+';
                        display: inline-flex;
                        position: absolute;
                        right: 0;
                        flex: 0 0 auto;
                        align-items: center;
                        justify-content: center;
                        width: 1.5rem;
                        height: 1.5rem;
                        border: 1px solid rgba(140, 65, 0, 0.35);
                        border-radius: 9999px;
                        color: #8C4100;
                        font-size: 1.1rem;
                        font-weight: 400;
                        line-height: 1;
                    }
                    #faq details[open] summary::after {
                        content: '-';
                    }
                `}</style>
                <div className="mx-auto max-w-6xl scroll-reveal">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex rounded-full border border-[#8C4100]/30 bg-[#F0E8E8] px-4 py-1.5 font-poppins text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8C4100] shadow-sm sm:text-xs">
                            Member support
                        </span>
                        <h2 className="mt-4 font-abhaya text-4xl font-medium text-[#363232] sm:text-5xl md:text-7xl">
                            Frequently Asked Questions
                        </h2>
                    </div>
                    <div className="mt-10 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
                        <div className="flex flex-col gap-3">
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-0 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    What is my Account ID?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Your Account ID identifies your property and is based on your neighborhood, block, and lot, such as <strong className="font-semibold">A001001</strong>. Your Account ID will be sent to your <strong className="font-semibold">registered Gmail address</strong> when your member account is created.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    Where can I get my temporary password?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    When your member account is created, the system will send your <strong className="font-semibold">Account ID and temporary password</strong> to your registered Gmail address.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    How do I log in for the first time?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Use the <strong className="font-semibold">Account ID and temporary password</strong> provided in the email sent to your registered Gmail address.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    I did not receive the email containing my Account ID and temporary password. What should I do?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    First, check your <strong className="font-semibold">spam or junk folder</strong>. If you still cannot find the email, your Gmail address may <strong className="font-semibold">not yet be registered with the HOA</strong>. Please contact the <strong className="font-semibold">HOA office</strong> to confirm or update your registered Gmail address and request assistance with your account credentials.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    Where will I receive the OTP?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    The OTP will be sent to the <strong className="font-semibold">Gmail address registered to your member account</strong>.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    What should I do if I do not receive the OTP?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Check your <strong className="font-semibold">spam or junk folder</strong> and verify your internet connection. You may request another OTP after the resend waiting period. If you still do not receive it, contact the HOA office.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    What if I forget my password?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Contact the HOA office and request a password reset. A new temporary password will be sent to your registered Gmail address.
                                </p>
                            </details>
                        </div>
                        <div className="flex flex-col gap-3">
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    What is the Member Agreement?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    The Member Agreement contains the <strong className="font-semibold">terms and conditions for using the member portal</strong>. You must accept the current agreement before accessing the dashboard.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    What is my Statement of Account?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Your Statement of Account, or <strong className="font-semibold">SOA</strong>, shows your billing information, payments, balance, amount due, and other account details.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    What does Amount Due / Excess mean?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    A <strong className="font-semibold">positive amount</strong> means you still have an amount to pay. A <strong className="font-semibold">negative amount</strong> means you have paid more than the amount due.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    Can I print or download my SOA?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Yes. Open <strong className="font-semibold">Preview SOA</strong> and use the available <strong className="font-semibold">export or print option</strong>.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    Why is my payment not showing yet?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Payments must first be <strong className="font-semibold">recorded and synchronized by the HOA office</strong> before they appear in your account.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    Can other people use my Account ID to access my account?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    <strong className="font-semibold">No.</strong> Your Account ID alone cannot be used to access your account. Access also requires your <strong className="font-semibold">password and, when required, the OTP</strong> sent to your registered Gmail address.
                                </p>
                            </details>
                            <details className="group rounded-2xl border border-[#8C4100]/15 bg-[#F0E8E8] px-5 py-4 shadow-sm">
                                <summary className="cursor-pointer list-none pr-8 font-poppins text-sm font-semibold text-[#363232] marker:hidden sm:text-base">
                                    What should I do if my Gmail address is incorrect?
                                </summary>
                                <p className="mt-3 font-poppins text-sm font-light leading-relaxed text-[#363232]/80">
                                    Contact the HOA office and request that your <strong className="font-semibold">registered Gmail address be updated</strong> before attempting account verification.
                                </p>
                            </details>
                        </div>
                    </div>
                </div>
            </section>
            <section
                className="relative min-h-[58vh] w-full bg-cover bg-center px-6 py-8 sm:min-h-[72vh] sm:px-10 sm:py-12 lg:px-16"
                id="contacts"
                style={{
                    backgroundImage: `url(${contactImage})`,
                }}
            >
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(240, 232, 232, 1) 0%, rgba(240, 232, 232, 1) 25%, rgba(110, 104, 104, 0.5) 60%)'
                    }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 scroll-reveal sm:gap-12">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex rounded-full border border-[#8C4100]/30 bg-[#FFFBFB]/80 px-4 py-1.5 font-poppins text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8C4100] shadow-sm sm:text-xs">
                            Get in touch
                        </span>
                        <h2 className="mt-4 font-abhaya text-4xl font-medium text-[#363232] sm:text-5xl md:text-7xl">
                            How to Contact Us
                        </h2>
                    </div>
                    <div className="relative flex flex-row items-center justify-center gap-1 sm:gap-4 lg:items-stretch lg:gap-8">
                        <div className="relative flex w-1/2 items-center justify-center px-0 py-4 sm:w-1/2 sm:max-w-md sm:px-8 sm:py-6 lg:w-5/12 lg:px-12">
                            <img
                                src={phoneImage}
                                alt="Contact Parkplace Village"
                                className="relative z-10 w-[120%] max-w-95 scale-[1.4] drop-shadow-lg sm:w-full sm:max-w-md sm:scale-[1.3]"
                            />
                        </div>
                        <div className="flex w-1/2 max-w-md flex-col justify-center gap-3 p-2 text-white drop-shadow-lg sm:w-1/2 sm:gap-6 sm:p-9 lg:w-5/12">
                            <div>
                                <p className="font-poppins text-xs font-semibold uppercase tracking-[0.2em] text-[#F4C58E]">
                                    Community support
                                </p>
                                <p className="mt-2 font-poppins text-[11px] font-light leading-relaxed text-white/90 sm:mt-3 sm:text-base md:text-lg">
                                    Get in touch with us for inquiries, concerns, or assistance. We are here to help make your community experience better.
                                </p>
                            </div>
                            <div className="h-px w-full bg-white/20"></div>
                            <button
                                type="button"
                                onClick={() => scrollToSection('location')}
                                className="inline-flex w-fit items-center gap-1 rounded-full bg-[#E89B58] px-3 py-2 font-poppins text-[10px] font-semibold text-white transition hover:bg-[#d88a47] hover:shadow-lg sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
                            >
                                Find our location <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    </div>
                </div>
                <img
                    src={bottomImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 h-24 w-full max-w-none -translate-x-1/2 object-fill sm:h-28 md:h-32 lg:h-36 xl:h-40"
                />
            </section>
            <section className="bg-[#F0E8E8] px-6 py-16 sm:px-10 lg:px-11" id="location">
                <div className="mx-auto max-w-6xl scroll-reveal">
                    <div className="mb-8 mx-auto max-w-xs" style={{ backgroundColor: '#FFFBFB', border: '2px solid rgba(179, 175, 175, 0.6)', opacity: 0.8, padding: '3px 16px', boxSizing: 'border-box' }}>
                        <h2 className="font-abhaya text-sm font-medium sm:text-base md:text-lg text-[#363232] text-center" style={{ color: '#363232' }}>
                            Where to find us?
                        </h2>
                    </div>
                    <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="w-full lg:w-1/2">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!4v1777427443898!6m8!1m7!1sSNj6h23X35TvCgbsM5kr1g!2m2!1d14.39214716449558!2d120.9394226792494!3f189.70530753591922!4f-19.383303460438853!5f0.7820865974627469"
                                width="100%"
                                height="450"
                                style={{ border: 0, borderRadius: '12px' }}
                                allow="accelerometer; gyroscope; magnetometer"
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Parkplace Village Guardhouse Location"
                            ></iframe>
                        </div>
                        <div className="flex flex-col gap-6 lg:w-1/2 lg:pl-8">
                            <h3 className="font-abhaya text-2xl font-medium sm:text-3xl text-[#363232]">
                                Parkplace Village Guardhouse
                            </h3>
                            <p className="font-poppins text-base font-extralight leading-relaxed text-[#363232] sm:text-lg">
                                Visit our guardhouse for any assistance or inquiries. Our friendly staff is ready to help you with information about the community.
                            </p>
                            <div className="space-y-3">
                                <p className="font-poppins text-sm sm:text-base text-[#363232]">
                                    <span className="font-semibold">Address:</span> 1-D Aguinaldo Hwy, Imus, 4103 Cavite
                                </p>
                                <p className="font-poppins text-sm sm:text-base text-[#363232]">
                                    <span className="font-semibold">Hours:</span> 24/7 Available
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="w-full h-0.5 bg-[#F0E8E8]">
                <div className="w-2/3 h-full" style={{ backgroundColor: 'rgba(179, 175, 175, 0.5)', opacity: 0.4 }}></div>
            </div>
            <section className="bg-[#F0E8E8] px-6 py-16 sm:px-10 lg:px-11">
                <div className="mx-auto max-w-6xl scroll-reveal">
                    <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-6 lg:w-1/2 lg:pr-8">
                            <h3 className="font-abhaya text-2xl font-medium sm:text-3xl text-[#363232]">
                                Parkplace Village Guardhouse
                            </h3>
                            <p className="font-poppins text-base font-extralight leading-relaxed text-[#363232] sm:text-lg">
                                Located at the entrance of the community, the guardhouse oversees security and assists with entry coordination.
                            </p>
                            <div className="space-y-3">
                                <p className="font-poppins text-sm sm:text-base text-[#363232]">
                                    <span className="font-semibold">Address:</span> 1-D Aguinaldo Hwy, Imus, 4103 Cavite
                                </p>
                                <p className="font-poppins text-sm sm:text-base text-[#363232]">
                                    <span className="font-semibold">Hours:</span> 24/7 Available
                                </p>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3864.6067972984597!2d120.9394226792494!3d14.39214716449558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d30040f8eac7%3A0x58a398c652addb26!2sParkplace%20Village%20Guardhouse!5e0!3m2!1sen!2sph!4v1777427659420!5m2!1sen!2sph"
                                width="100%"
                                height="450"
                                style={{ border: 0, borderRadius: '12px' }}
                                allow="accelerometer; gyroscope; magnetometer"
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Parkplace Village Guardhouse Location"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
