"use client";
import Image from 'next/image';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Import all images
import wtIco1 from '@/assets/images/home-four/wt-ico-1.webp';
import wtIco2 from '@/assets/images/home-four/wt-ico-2.webp';
import wtIco3 from '@/assets/images/home-four/wt-ico-3.webp';
import wtIco4 from '@/assets/images/home-four/wt-ico-4.webp';
import wtIco5 from '@/assets/images/home-four/wt-ico-5.webp';
import wtIco6 from '@/assets/images/home-four/wt-ico-6.webp';
import serviceCircleShape from '@/assets/images/home-four/service-circle-shape.webp';
import shape1 from '@/assets/images/home-four/shape-1.webp';
import shape2 from '@/assets/images/home-four/shape-2.webp';
import shape3 from '@/assets/images/home-four/shape-3.webp';
import shape4 from '@/assets/images/home-four/shape-4.webp';

const services = [
  {
    icon: wtIco3,
    title: 'CNIC Extraction',
    description: 'Automatically extract and process information from Computerized National Identity Cards (CNIC) with high accuracy.',
  },
  {
    icon: wtIco2,
    title: 'UAE Document Processing',
    description: 'Efficiently handle and analyze Emirates ID data, streamlining identity verification processes.',
  },
  {
    icon: wtIco1,
    title: 'RAG Chat',
    description: 'Chat with AI using your own knowledge base',
  }
];

const ServiceItem = ({ icon, title, description, delay }) => (
  <div 
    data-aos="fade-left" 
    data-aos-delay={delay}
    className="service-item p-5 md:p-[50px] relative group"
  >
    <div className="service-item-ico w-[80px] h-[80px] rounded-[10px] flex justify-center items-center mb-7">
      <Image src={icon} alt="" width={50} height={50} className="relative z-10" />
    </div>
    <h1 className="mb-5 text-white font-medium">{title}</h1>
    <p className="text-white opacity-55">{description}</p>
    <div className="circle-shape absolute left-0 top-0 flex justify-center items-center w-full h-full group-hover:opacity-100 opacity-0 transition duration-300 ease-in-out">
      <Image src={serviceCircleShape} alt="" width={300} height={300} />
    </div>
  </div>
);


const About = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <section id="about" className="w-full what-we-do-wrapper pb-16 md:pb-[130px] pt-16 md:pt-[130px] relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="w-full">
          <div className="title-area w-full flex justify-center">
            <div className="flex flex-col items-center">
              <div className="section-title-top-tag-two mb-5">
                <span className="text-blue-400">Our Services</span>
              </div>
              <div className="mb-[70px]">
                <h2 className="text-white font-semibold text-2xl sm:text-5xl text-center">
                Empower Your Business with <br /> Advanced AI Tools
                </h2>
              </div>
            </div>
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
            {services.map((service, index) => (
              <ServiceItem key={index} {...service} delay={index * 100} />
            ))}
          </div>
        </div>
      </div>
      {[shape1, shape2, shape3, shape4].map((shape, index) => (
        <div key={index} className={`shape-${index + 1} absolute z-10 ${index % 2 === 1 ? 'right-1/4' : 'left-1/4'} ${index <= 1 ? 'top-1/4' : 'top-3/4'}`}>
          <Image src={shape} alt="" width={20} height={20} />
        </div>
      ))}
    </section>
  );
};

export default About;