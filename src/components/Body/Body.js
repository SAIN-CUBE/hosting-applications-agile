"use client"
import { useState , useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Import images
import heroShape2 from "@/assets/images/home-four/hero-shape-2.webp";
import heroThumb from "@/assets/images/home-four/hero-thumb.webp";
import heroThumbShadow from "@/assets/images/home-four/hero-thumb-shadow.svg";
import heroShape3 from "@/assets/images/home-four/hero-shape-3.webp";
import shape1 from "@/assets/images/home-four/shape-1.webp";
import shape2 from "@/assets/images/home-four/shape-2.webp";
import shape3 from "@/assets/images/home-four/shape-3.webp";
import shape4 from "@/assets/images/home-four/shape-4.webp";

const Body = () => {
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');

  const openVideoPlayer = () => {
    setVideoSrc('https://www.youtube.com/embed/ZUXNCY2R5Wo?si=E8zWRcLieSpVH2z4&autoplay=1');
    setIsVideoPlayerOpen(true);
  };

  const closeVideoPlayer = () => {
    setIsVideoPlayerOpen(false);
    setVideoSrc('');
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeVideoPlayer();
      }
    };

    if (isVideoPlayerOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVideoPlayerOpen]);

  return (
    <main className="max-w-6xl mx-auto overflow-hidden px-4">
      <section id="banner" className="w-full">
        <Image src={heroShape2} alt="" width={200} height={200} className='absolute left-32 top-0 z-0' />
        <div className="relative">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex justify-center mt-[180px]">
              <div>
                <h1 className="text-[29px] sm:text-3xl md:text-5xl md:leading-[60px] font-semibold text-white text-center mb-7 md:mb-[30px] mx-auto">
                Empowering Intelligence Through <br />
                  <span className="text-purple">AI Tool Hosting</span>
                </h1>
                <div className="flex justify-center mb-5 md:mb-[55px]">
                  <p className="text-white sm:text-18 font-medium text-center max-w-4xl">
                  Introducing our cutting-edge AI Tool Hosting platform, designed to streamline your access to powerful AI technologies. Our application combines seamless credit management, team collaboration, and state-of-the-art AI tools to enhance your business operations in the digital age.
                  </p>
                </div>
                <div className="flex justify-center mb-[100px]">
                  <div className="flex flex-col md:flex-row gap-10 items-center">
                    <Link href="/pricing">
                      <div className="home-two-btn-bg py-3.5 group h4_contact_bg border-transparent w-fit mt-2.5">
                        <span className="text-pone text-white group-hover:text-purple transition-all duration-300 font-inter relative z-10">
                          Start Free Trial
                        </span>
                        <svg className="relative z-10" width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path className="group-hover:stroke-purple transition-all duration-300" d="M1.10254 10.5L4.89543 6.70711C5.22877 6.37377 5.39543 6.20711 5.39543 6C5.39543 5.79289 5.22877 5.62623 4.89543 5.29289L1.10254 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </Link>
                    <button
                      type="button"
                      aria-label="play-video"
                      className="video-play-btn flex space-x-8 items-center"
                      onClick={openVideoPlayer}
                    >
                      <span className="flex size-[56px] rounded-full justify-center items-center bg-white bg-opacity-5 relative">
                        <span>
                          <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.4611 8.29308L3.49228 12.8467C2.15896 13.6086 0.5 12.6459 0.5 11.1102V2.00295C0.5 0.467309 2.15896 -0.495425 3.49228 0.266469L11.4611 4.82011C12.8048 5.5879 12.8048 7.52529 11.4611 8.29308Z" fill="white" />
                          </svg>
                        </span>
                        <div className="absolute w-full h-full left-0 top-0 rounded-full play-btn-line1"></div>
                        <div className="absolute w-full h-full rounded-full play-btn-line2"></div>
                        <div className="absolute w-full h-full rounded-full play-btn-line3"></div>
                      </span>
                      <span className="text-white font-semibold border-b border-white">How IT Works</span>
                    </button>
                  </div>
                </div>
                <div
                  id="hero-banner"
                  className="hero-banner flex justify-center"
                >
                  <div className="img relative">
                    <img
                      src={heroThumb.src}
                      alt=""
                      className="relative z-10"
                    />
                    <div className="absolute -top-8 md:-top-[80px] left-0">
                      <div className="flex justify-center ">
                        <img
                          src={heroThumbShadow.src}
                          alt=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <div className="max-w-5xl mx-auto mt-32">
            <h1 className=" text-center font-medium text-white">
              We've more then 1250+ global clients
            </h1>
            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              loop={true}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              breakpoints={{
                320: {
                  slidesPerView: 3,
                  spaceBetween: 20
                },
                640: {
                  slidesPerView: 5,
                  spaceBetween: 40
                },
                1024: {
                  slidesPerView: 6,
                  spaceBetween: 50
                }
              }}
              className="h3-partner_slider mt-12 overflow-hidden"
            >
              {[indeed, linkedIn, mailchimp, metacritic, spotify, dropbox, hootsuite].map((logo, index) => (
                <SwiperSlide key={index}>
                  <Image src={logo} alt="" width={110} height={50} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div> */}
        </div>
        <div className="absolute right-[137px] top-[260px]">
          <Image src={heroShape3} alt="" width={200} height={200} />
        </div>
        <div className="w-full verflow-hidden absolute left-0 -bottom-10 sm:-bottom-24 md:-bottom-[130px]">
          <div className="line-shape w-full"></div>
        </div>
        <div className="shape-1 absolute left-40 top-96 z-10">
          <Image src={shape1} alt="" width={20} height={20} />
        </div>
        <div className="shape-2 absolute right-96 top-96 z-10">
          <Image src={shape2} alt="" width={20} height={20} />
        </div>
        <div className="shape-3 absolute left-96 top-[550px] z-10">
          <Image src={shape3} alt="" width={20} height={20} />
        </div>
        <div className="shape-4 absolute right-96 top-[550px] z-10">
          <Image src={shape4} alt="" width={20} height={20} />
        </div>
      </section>

   {/* Video Player */}
   {isVideoPlayerOpen && (
        <div
          id="video-player"
          className="fixed top-0 left-0 w-screen h-screen bg-black/70 z-[51] flex justify-center items-center player-open-anim transition-all duration-300 overflow-hidden origin-top-left"
        >
          <button
            className="absolute right-4 top-4 text-white text-3xl hover:text-gray-300 transition-colors duration-300"
            onClick={closeVideoPlayer}
            aria-label="Close video"
          >
            &times;
          </button>
          <div className="relative w-[90%] max-w-[1280px] aspect-video">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={videoSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </main>
  );
};

export default Body;