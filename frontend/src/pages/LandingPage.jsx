import { useNavigate } from 'react-router-dom';
import landingImage from '../images/Rectangle.png';
import designImage from '../images/design.png';
import rectangleImage from '../images/Rectangle 5.png';
import aboutImage from '../images/about.png';
import coverImage from '../images/cover.png';
import contactImage from '../images/contact.png';
import containerImage from '../images/container.png';
import phoneImage from '../images/phone.png';
import bubbleThoughtImage from '../images/bubblethought.png';
import bubbleThought1Image from '../images/bubblethought1.png';
import loginImage from '../images/login.png';
import bottomImage from '../images/bottom.png';

export default function LandingPage() {
    const navigate = useNavigate();
    return (
        <>
            <div className="relative min-h-[70vh] w-full overflow-hidden bg-[#C49554] sm:min-h-screen">
                <div className="absolute left-1/2 top-4 z-10 flex w-[min(92vw,1100px)] -translate-x-1/2 items-center justify-between gap-4 text-[#363232]">
                    <div className="flex items-center gap-6 text-sm font-abhaya sm:gap-10 sm:text-base md:gap-12 md:text-xl">
                        <span>Home</span>
                        <span>About</span>
                    </div>
                    <div className="relative w-[120px] sm:w-[200px] md:w-[250px]">
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
                        <span>Contacts</span>
                        <span>Location</span>
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
                    <div className="absolute bottom-8 left-4 z-20 w-32 sm:bottom-45 sm:left-0 sm:w-40 md:w-55">
                        <img
                            src={loginImage}
                            alt="Login"
                            className="h-auto w-full"
                        />
                        <button
                            onClick={() => navigate('/login')}
                            className="absolute inset-0 flex items-center justify-center text-base font-semibold text-[#363232] transition hover:opacity-90 sm:text-lg">
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
            <section className="bg-[#F0E8E8] px-6 py-16 sm:px-10 lg:px-11">
                <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
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
                style={{
                    backgroundImage: `url(${contactImage})`,
                }}
            >
                <img
                    src={containerImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12">
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
        </>
    );
}
