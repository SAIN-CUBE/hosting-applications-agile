import Image from 'next/image';
import Link from 'next/link';

import Shape1 from '@/assets/images/home-four/shape-1.webp';
import Shape2 from '@/assets/images/home-four/shape-2.webp';
import Shape3 from '@/assets/images/home-four/shape-3.webp';
import Shape4 from '@/assets/images/home-four/shape-4.webp';

const PricingCard = ({ title, price, description, features, isPopular }) => (
  <div className={`col-span-4 border border-white/10 bg-white/5 rounded-xl p-5 md:p-[50px] price_card_bg transition-all duration-300 ${isPopular ? 'relative' : ''}`}>
    {isPopular && (
      <div className="flex gap-2 py-2 px-4 bg-purple rounded-3xl w-fit absolute top-2.5 right-2.5">
        {[...Array(3)].map((_, i) => (
                    <svg
                    key={i}
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_460_24798)">
                      <path
                        d="M6.49956 7.1091L0.0322266 4.9542C0.0850377 4.82014 0.204878 4.72244 0.347062 4.70233L4.34649 4.11328L6.49956 7.1091Z"
                        fill="white"
                      />
                      <path
                        d="M6.49966 7.10889V10.8402L2.92272 12.7495C2.7846 12.8226 2.62028 12.8107 2.49414 12.717L6.49966 7.10889Z"
                        fill="white"
                      />
                      <path
                        d="M6.50012 7.10901L2.4944 12.7169C2.3707 12.6257 2.30753 12.4693 2.33414 12.3129L3.01642 8.27106L6.50012 7.10901Z"
                        fill="white"
                      />
                      <path
                        d="M6.50002 7.109L3.01652 8.27105L0.123887 5.40686C0.0123738 5.29717 -0.0284533 5.13244 0.0202954 4.98437C0.0245609 4.97421 0.026389 4.96385 0.0326857 4.9541L6.50002 7.109Z"
                        fill="white"
                      />
                      <path
                        d="M6.49975 0.203125V7.1092L4.34668 4.11318L6.13617 0.43265C6.20319 0.292295 6.34538 0.203125 6.49975 0.203125Z"
                        fill="white"
                      />
                      <path
                        d="M8.65307 4.113L6.5 7.10902V0.202942C6.65437 0.202942 6.79656 0.292112 6.86358 0.432467L8.65307 4.113Z"
                        fill="white"
                      />
                      <path
                        d="M12.9673 4.9541L6.5 7.10899L8.65307 4.11298L12.6525 4.70202C12.7947 4.72234 12.9145 4.81983 12.9673 4.9541Z"
                        fill="white"
                      />
                      <path
                        d="M12.878 5.40686L9.9835 8.27105L6.5 7.109L12.9673 4.9541C12.9734 4.96405 12.9755 4.97441 12.9797 4.98437C13.0283 5.13264 12.9876 5.29717 12.878 5.40686Z"
                        fill="white"
                      />
                      <path
                        d="M10.5055 12.7169L6.5 7.10901L9.98351 8.27106L10.666 12.3129C10.6924 12.4695 10.6294 12.6257 10.5055 12.7169Z"
                        fill="white"
                      />
                      <path
                        d="M10.5055 12.7169C10.3796 12.8106 10.2151 12.8228 10.0771 12.7494L6.5 10.8403V7.10901L10.5055 12.7169Z"
                        fill="white"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_460_24798">
                        <rect width="13" height="13" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
        ))}
      </div>
    )}
    <h1 className="text-18 font-semibold text-white pb-4">{title}</h1>
    <h2 className="text-4xl text-white">
      ${price}<span className="text-base leading-[30px]">/ per monthly</span>
    </h2>
    <p className="text-white text-[13.8px] pb-8 pt-4">{description}</p>
    <Link href="/pricing" className="group bg-white w-full h-11 md:h-[56px] flex justify-center items-center gap-2.5 rounded-[40px] relative price_button_bg before:inline-block before:absolute before:w-full before:h-full before:scale-x-0 hover:before:scale-x-100 overflow-hidden before:transition-transform before:ease-out before:duration-300 before:origin-right hover:before:origin-left before:z-0">
      <span className="font-inter font-semibold text-purple relative z-10 group-hover:text-white transition-all duration-300">
        Choose This Package
      </span>
      <svg className="relative z-10" width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className="group-hover:stroke-white transition-all duration-300" d="M1 10.5L4.79289 6.70711C5.12623 6.37377 5.29289 6.20711 5.29289 6C5.29289 5.79289 5.12623 5.62623 4.79289 5.29289L1 1.5" stroke="#794AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
    <ul className="flex flex-col gap-4 mt-9">
      {features.map((feature, index) => (
        <li key={index} className="flex gap-3 items-center">
          <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.1035 0.411506C18.9741 0.281114 18.8203 0.177618 18.6507 0.10699C18.4812 0.0363625 18.2994 0 18.1157 0C17.9321 0 17.7502 0.0363625 17.5807 0.10699C17.4112 0.177618 17.2573 0.281114 17.128 0.411506L6.76377 10.7897L2.4094 6.42137C2.27512 6.29166 2.11661 6.18967 1.94292 6.12122C1.76922 6.05276 1.58375 6.0192 1.39708 6.02243C1.21041 6.02565 1.0262 6.06562 0.854981 6.14004C0.683758 6.21446 0.528869 6.32187 0.399158 6.45615C0.269447 6.59043 0.167455 6.74894 0.099004 6.92264C0.0305528 7.09633 -0.00301682 7.28181 0.000212736 7.46847C0.00344229 7.65514 0.0434076 7.83935 0.117826 8.01057C0.192245 8.18179 0.29966 8.33668 0.433938 8.46639L5.77604 13.8085C5.90537 13.9389 6.05923 14.0424 6.22876 14.113C6.39829 14.1836 6.58012 14.22 6.76377 14.22C6.94742 14.22 7.12926 14.1836 7.29878 14.113C7.46831 14.0424 7.62218 13.9389 7.7515 13.8085L19.1035 2.45653C19.2447 2.32626 19.3574 2.16815 19.4345 1.99217C19.5115 1.81618 19.5513 1.62614 19.5513 1.43402C19.5513 1.24189 19.5115 1.05185 19.4345 0.875871C19.3574 0.699888 19.2447 0.541779 19.1035 0.411506Z" fill="#794AFF" />
          </svg>
          <span className="sm:text-md font-medium text-white">{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

const PricingSection = () => {
  const pricingData = [
    {
      title: "Basic Plan",
      price: "49.00",
      description: "Ideal for small teams and startups",
      features: [
        "Access to CNIC Extraction Tool",
        "5,000 Monthly Credit Limit",
        "Basic Team Management",
        "Email Support",
        "Monthly Usage Reports"
      ]
    },
    {
      title: "Professional Plan",
      price: "99.00",
      description: "Perfect for growing businesses",
      features: [
        "Access to All AI Tools",
        "25,000 Monthly Credit Limit",
        "Advanced Team Management",
        "Priority Email & Phone Support",
        "Detailed Analytics Dashboard"
      ],
      isPopular: true
    },
    {
      title: "Enterprise Plan",
      price: "Custom",
      description: "Tailored solutions for large organizations",
      features: [
        "Unlimited Access to All AI Tools",
        "Custom Credit Allocation",
        "Dedicated Account Manager",
        "24/7 Premium Support",
        "Custom Integration Options"
      ]
    }
  ];

  return (
    <section id="pricing" className="relative">
      <div className="max-w-6xl mx-auto w-full h4-pricing-wrapper pt-16 md:pt-[130px] pricing_section_bg">
        <div className="theme-container mx-auto">
          <div className="w-full">
            <div className="title-area w-full flex justify-center">
              <div className="flex flex-col items-center">
                <div className="section-title-top-tag-two mb-5">
                <span>Subscription Options</span>
                </div>
                <div className="mb-[60px]">
                  <h2 className="text-white font-semibold text-24 sm:text-48 text-center max-w-[819px]">
                  Flexible Plans to Power Your <br /> AI-Driven Workflows
                  </h2>
                </div>
              </div>
            </div>
            <div className="w-full grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-[30px]">
              {pricingData.map((plan, index) => (
                <PricingCard key={index} {...plan} />
              ))}
            </div>
          </div>
        </div>
        <div className="shape-1 absolute left-40 top-96 z-10">
          <Image src={Shape1} alt="Shape 1" />
        </div>
        <div className="shape-2 absolute right-96 top-96 z-10">
          <Image src={Shape2} alt="Shape 2" />
        </div>
        <div className="shape-3 absolute left-96 top-[550px] z-10">
          <Image src={Shape3} alt="Shape 3" />
        </div>
        <div className="shape-4 absolute right-96 top-[550px] z-10">
          <Image src={Shape4} alt="Shape 4" />
        </div>
      </div>
    </section>
  );
};

export default PricingSection;