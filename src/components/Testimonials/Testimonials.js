"use client";
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/free-mode';

import testimonial1 from '@/assets/images/home-four/testimonial/1.webp';
import testimonial2 from '@/assets/images/home-four/testimonial/2.webp';
import testimonial3 from '@/assets/images/home-four/testimonial/3.webp';
import testimonial4 from '@/assets/images/home-four/testimonial/4.webp';
import testimonial5 from '@/assets/images/home-four/testimonial/5.webp';
import testimonial6 from '@/assets/images/home-four/testimonial/6.webp';
import testimonial7 from '@/assets/images/home-four/testimonial/7.webp';
import testimonial8 from '@/assets/images/home-four/testimonial/8.webp';

const testimonials = [
  { image: testimonial1, name: 'Sarah L. Johnson', role: 'Data Analyst' },
  { image: testimonial2, name: 'Michael R. Chen', role: 'IT Manager' },
  { image: testimonial3, name: 'Emily K. Rodriguez', role: 'HR Director' },
  { image: testimonial4, name: 'David T. Williams', role: 'Security Consultant' },
  { image: testimonial5, name: 'Olivia S. Patel', role: 'Operations Manager' },
  { image: testimonial6, name: 'James M. Thompson', role: 'Software Engineer' },
  { image: testimonial7, name: 'Sophia N. Lee', role: 'Compliance Officer' },
  { image: testimonial8, name: 'Daniel R. Garcia', role: 'Business Analyst' },
];

const testimonialTexts = [
  "The AI tools provided by this platform have significantly streamlined our data processing workflows. The CNIC extraction tool is particularly impressive, saving us hours of manual work.",
  "The credit management system is intuitive and has made it easy for us to allocate resources across our team. The reporting features provide valuable insights into our AI tool usage.",
  "The Emirates ID processing tool has been a game-changer for our HR department. It's fast, accurate, and has greatly reduced our onboarding time for new employees.",
  "As a business analyst, I appreciate the detailed reports and analytics provided by the platform. It helps me make data-driven decisions about our AI tool investments.",
  "The customer support team is responsive and knowledgeable. They've been incredibly helpful in optimizing our use of the AI tools for our specific needs.",
  "The flexibility of the subscription plans allowed us to start small and scale up as our needs grew. It's been a cost-effective solution for our AI processing requirements.",
  "The integration of these AI tools into our existing workflows was seamless. The API documentation is comprehensive and made the process straightforward for our dev team.",
  "The constant updates and improvements to the AI tools show the platform's commitment to staying at the forefront of technology. We're excited to see what new features are coming next."
];

const TestimonialSection = () => {
  return (
    <section
      className="w-full overflow-hidden pb-16 md:pb-[130px] h4-testimonial-bg pt-16 md:pt-[130px]"
      id="testimonials"
    >
      <div className="flex w-full justify-center items-center flex-col mb-[60px]">
        <h1 className="py-0.5 px-5 bg-white/5 border-white/10 border rounded-[30px] font-medium text-white">
          Our Testimonials
        </h1>
        <h2 className="text-24 px-5 sm:px-0 sm:text-48 font-semibold text-white mt-5 flex">
          <p
            className="w-40 text-end"
            data-scroll-qs="scroll"
            data-count-qs="1250"
            data-type-qs="+"
            data-speed-qs="2000"
          >
            1250+
          </p>
          Customer Say Our Services
        </h2>
      </div>

      <TestimonialSlider direction="normal" />
      <TestimonialSlider direction="reverse" />
    </section>
  );
};



const TestimonialSlider = ({ direction }) => {
  const swiperRef = useRef(null);

  useEffect(() => {
    const swiper = swiperRef.current?.swiper;
    if (swiper) {
      swiper.update();
    }
  }, []);

  return (
    <Swiper
      ref={swiperRef}
      modules={[Autoplay, FreeMode]}
      spaceBetween={30}
      centeredSlides={true}
      freeMode={true}
      speed={direction === 'normal' ? 10000 : 8000}
      autoplay={{
        delay: 1,
        disableOnInteraction: false,
        reverseDirection: direction === 'reverse',
      }}
      loop={true}
      slidesPerView={1}
      allowTouchMove={false}
      breakpoints={{
        1: { slidesPerView: 1.1 },
        768: { slidesPerView: 2 },
        992: { slidesPerView: 2.5 },
        1200: { slidesPerView: 3 },
        1400: { slidesPerView: 3.5 },
        1600: { slidesPerView: 4 },
        1900: { slidesPerView: 4.5 },
      }}
      className="mb-[30px]"
    >
      {testimonials.map((testimonial, index) => (
        <SwiperSlide key={index}>
          <TestimonialCard {...testimonial} index={index} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

const TestimonialCard = ({ image, name, role, index }) => {
  return (
    <div className="px-10 py-9 bg-white/5 rounded-xl border border-white/10 transition-all duration-300">
      <div className="flex items-center gap-5">
        <div className="w-[46px] h-[46px] rounded-full overflow-hidden">
          <Image src={image} alt={name} className="w-full object-cover" />
        </div>
        <p className='grid place-content-between'>
          <span className="text-white text-18 font-semibold font-inter">
            {name}
          </span>
          <span className="text-white/50 font-normal text-sm">{role}</span>
        </p>
      </div>
      <p className="text-white/50 pt-6">
        "{testimonialTexts[index % testimonialTexts.length]}"
      </p>
    </div>
  );
};

export default TestimonialSection;