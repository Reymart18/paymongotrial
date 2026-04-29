import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import landingImage from '../images/Rectangle.png';
import designImage from '../images/design.png';
import rectangleImage from '../images/Rectangle 5.png';
import aboutImage from '../images/about.png';
import coverImage from '../images/cover.png';
import contactImage from '../images/contact.png';
import phoneImage from '../images/phone.png';
import bubbleThoughtImage from '../images/bubblethought.png';
import bubbleThought1Image from '../images/bubblethought1.png';
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
            const duration = 700; // 1.5 seconds for smooth scroll
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
                <div className="absolute left-1/2 top-4 z-10 flex w-[min(92vw,1100px)] -translate-x-1/2 items-center justify-between gap-4 text-[#363232]">
                    <div className="flex items-center gap-6 text-sm font-abhaya sm:gap-10 sm:text-base md:gap-12 md:text-xl">
                        <button onClick={() => scrollToSection('home')} className="cursor-pointer hover:opacity-70 transition">Home</button>
                        <button onClick={() => scrollToSection('about')} className="cursor-pointer hover:opacity-70 transition">About</button>
                    </div>
                    <div className="relative w-30 sm:w-50 md:w-60 -top-4.5">
                        <img
                            src={rectangleImage}
                            alt=""
                            aria-hidden="true"
                            className="w-full"
                        />
                        <div className="absolute inset-0 flex items-start justify-center pt-3 sm:pt-4">
                            <span className="font-allison text-xl text-[white] sm:text-3xl md:text-4xl">
                                Parkplace Village
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-abhaya sm:gap-10 sm:text-base md:gap-12 md:text-xl">
                        <button onClick={() => scrollToSection('contacts')} className="cursor-pointer hover:opacity-70 transition">Contacts</button>
                        <button onClick={() => scrollToSection('location')} className="cursor-pointer hover:opacity-70 transition">Location</button>
                    </div>
                </div>
                <img
                    src={landingImage}
                    alt=""
                    aria-hidden="true"
                    className="h-[70vh] w-full object-cover opacity-60 sm:h-screen"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-[white]">
                    <h1 className="font-abhaya text-3xl font-medium sm:text-4xl md:text-5xl">
                        Explore Home Your HOA Community
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm font-poppins font-extralight sm:text-base md:text-lg">
                        Discover a safe, organized, and welcoming community where every home is part of
                        something bigger.
                    </p>
                    <div className="absolute bottom-8 left-0 z-20 w-40 sm:w-40 md:w-55 transition duration-300 hover:scale-105 hover:opacity-80 hover:shadow-lg cursor-pointer">
                        <img
                            src={loginImage}
                            alt="Login"
                            className="h-auto w-full"
                        />
                        <button
                            onClick={() => navigate('/login')}
                            className="absolute inset-0 flex items-center justify-center text-base font-semibold text-[#363232] sm:text-lg">
                            Login Here
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
                            Discover a safe, organized, and welcoming community where every home is part of something bigger. Enjoy a balanced lifestyle with shared spaces, friendly neighbors, and reliable community management.
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
                            className="w-full rounded-lg relative z-10"
                        />
                    </div>
                </div>
            </section>
            <section
                className="relative min-h-screen w-full bg-cover bg-center px-6 py-16 sm:px-10 lg:px-16"
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
                <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 scroll-reveal">
                    <h2 className="font-abhaya text-4xl font-medium sm:text-5xl md:text-7xl text-black text-center">
                        How to Contact Us
                    </h2>
                    <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative flex items-center justify-center lg:w-5/12">
                            <img
                                src={phoneImage}
                                alt="Phone"
                                className="w-full max-w-sm"
                            />
                            <img
                                src={bubbleThoughtImage}
                                alt=""
                                aria-hidden="true"
                                className="absolute right-0 top-[18%] w-28 sm:w-40 md:w-48"
                            />
                            <img
                                src={bubbleThought1Image}
                                alt=""
                                aria-hidden="true"
                                className="absolute bottom-8 left-0 w-28 sm:w-40 md:w-48"
                            />
                        </div>
                        <div className="flex flex-col gap-6 text-white lg:w-5/12 lg:items-start">
                            <p className="font-poppins text-sm font-extralight leading-relaxed sm:text-base md:text-lg">
                                Get in touch with us for any inquiries or concerns. We're here to help and answer any question you might have.
                            </p>
                        </div>
                    </div>
                </div>
                <img
                    src={bottomImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 w-full max-w-none -translate-x-1/2"
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
