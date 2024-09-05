"use client";
import { useState } from 'react';
import Image from 'next/image';
import shape1 from '@/assets/images/home-four/shape-1.webp';
import shape2 from '@/assets/images/home-four/shape-2.webp';
import shape3 from '@/assets/images/home-four/shape-3.webp';
import shape4 from '@/assets/images/home-four/shape-4.webp';

const FAQItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`py-2.5 md:py-5 px-2 md:px-9 w-full bg-white/5 border border-white/10 rounded-[10px] overflow-hidden transition-all duration-300 ${
        isOpen ? 'max-h-fit' : 'max-h-[60px]'
      }`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="w-full flex justify-between items-center cursor-pointer">
        <h3 className="font-semibold sm:text-18 text-white">{question}</h3>
        <svg
          className={`transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          width="19"
          height="10"
          viewBox="0 0 19 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2L9.5 8L17 2"
            stroke="#FFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className={`mt-3.5 text-white ${isOpen ? 'block' : 'hidden'}`}>
        {answer}
      </p>
    </div>
  );
};

const FAQ = () => {
  const faqData = [
    {
      question: 'What are some common applications of AI software?',
      answer:
        'Businesses can leverage AI software to optimize processes, improve customer engagement, personalize experiences, optimize resource allocation, gain competitive insights, automate routine tasks, detect anomalies and fraud, and drive innovation across various functions and departments.',
    },
    {
      question: 'How can businesses leverage AI software?',
      answer:
        'Businesses can leverage AI software to optimize processes, improve customer engagement, personalize experiences, optimize resource allocation, gain competitive insights, automate routine tasks, detect anomalies and fraud, and drive innovation across various functions and departments.',
    },
    {
      question: 'What are some examples of popular AI software platforms?',
      answer:
        'Businesses can leverage AI software to optimize processes, improve customer engagement, personalize experiences, optimize resource allocation, gain competitive insights, automate routine tasks, detect anomalies and fraud, and drive innovation across various functions and departments.',
    },
    {
      question: 'How does AI software work?',
      answer:
        'Businesses can leverage AI software to optimize processes, improve customer engagement, personalize experiences, optimize resource allocation, gain competitive insights, automate routine tasks, detect anomalies and fraud, and drive innovation across various functions and departments.',
    },
  ];

  return (
    <section id="faq" className="relative w-full pt-16 md:pt-[130px]">
      <div className="bg-circle_color w-[408px] h-[408px] rounded-full absolute -left-[204px] -top-[150px]"></div>
      <div className="w-full relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-10 md:py-20 relative sm:border rounded-3xl border-white/10 sm:bg-white/5 overflow-hidden">
            <div className="max-w-[850px] w-full flex justify-center items-center flex-col relative z-10">
              <span className="py-0.5 px-5 bg-white/5 border-white/10 border rounded-[30px] font-medium text-white">
                FAQs
              </span>
              <h2 className="text-2xl sm:text-5xl font-semibold text-white mt-5 text-center">
                Asked Questions & Answer
              </h2>
              <div className="flex flex-col gap-2.5 w-full mt-10 sm:px-4">
                {faqData.map((faq, index) => (
                  <FAQItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="shape-1 absolute left-40 top-96 z-10">
        <Image
          src={shape1}
          alt="Shape 1"
          width={30}
          height={30}
        />
      </div>
      <div className="shape-2 absolute right-96 top-96 z-10">
        <Image
          src={shape2}
          alt="Shape 2"
          width={30}
          height={30}
        />
      </div>
      <div className="shape-3 absolute left-96 top-[550px] z-10">
        <Image
          src={shape3}
          alt="Shape 3"
          width={30}
          height={30}
        />
      </div>
      <div className="shape-4 absolute right-96 top-[550px] z-10">
        <Image
          src={shape4}
          alt="Shape 4"
          width={20}
          height={20}
        />
      </div>
      <div className="bg-circle_color w-[408px] h-[408px] rounded-full absolute -right-[204px] bottom-0"></div>
    </section>
  );
};

export default FAQ;