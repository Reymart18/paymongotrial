import landingImage from '../images/landingpage.png';
import designImage from '../images/design.png';
import rectangleImage from '../images/Rectangle 5.png';

export default function LandingPage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#C49554]">
            <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-4 text-[#363232] sm:gap-6">
                <div className="flex items-center gap-20 text-xl font-abhaya">
                    <span>Home</span>
                    <span>About</span>
                </div>
                <div className="relative w-[120px] sm:w-[250px]">
                    <img
                        src={rectangleImage}
                        alt=""
                        aria-hidden="true"
                        className="w-full"
                    />
                    <div className="absolute inset-0 flex items-start justify-center pt-4">
                        <span className="font-allison text-2xl text-[white] sm:text-4xl">
                            Parkplace Village
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-20 text-xl font-abhaya">
                    <span>Contacts</span>
                    <span>Location</span>
                </div>
            </div>
            <img
                src={landingImage}
                alt=""
                aria-hidden="true"
                className="max-h-screen w-full max-w-full object-contain opacity-60"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-[white]">
                <h1 className="font-abhaya text-3xl font-medium sm:text-4xl md:text-5xl">
                    Explore Home Your HOA Community
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-poppins font-extralight sm:text-base md:text-lg">
                    Discover a safe, organized, and welcoming community where every home is part of
                    something bigger.
                </p>
            </div>
            <img
                src={designImage}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[-10%] left-2 w-full"
            />
        </div>
    );
}
