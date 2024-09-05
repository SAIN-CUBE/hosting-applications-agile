// components/Features.js
import Image from 'next/image';

// Import feature icons
import featureIcon1 from '@/assets/images/home-four/feature-ico-1.webp';
import featureIcon2 from '@/assets/images/home-four/feature-ico-2.webp';
import featureIcon3 from '@/assets/images/home-four/feature-ico-3.webp';

// Import feature thumbnail
import featureThumb from '@/assets/images/home-four/features-thumb.webp';

// Import shape images
import shape1 from '@/assets/images/home-four/shape-1.webp';
import shape2 from '@/assets/images/home-four/shape-2.webp';
import shape3 from '@/assets/images/home-four/shape-3.webp';
import shape4 from '@/assets/images/home-four/shape-4.webp';

const FeatureItem = ({ icon, title, description, delay = 0 }) => (
  <div data-aos="fade-up" data-aos-delay={delay} className="feature-item-h-4">
    <div className="feature-item-wrapper w-full px-5 py-5 md:px-[30px] md:py-[35px] flex flex-col sm:flex-row gap-5 sm:gap-10 items-start">
      <img src={icon.src} alt={title} width={30} height={30} />
      <div className="flex-1">
        <h3 className="text-white font-semibold text-22 mb-3 leading-none">
          {title}
        </h3>
        <p className="text-white opacity-50">{description}</p>
      </div>
    </div>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: featureIcon1,
      title: 'Intuitive Dashboard',
      description: 'Access a user-friendly dashboard tailored to your role, providing quick access to credits, recent activity, and key information.',
    },
    {
      icon: featureIcon2,
      title: 'Flexible Team Management',
      description: 'Easily manage team members, assign roles, and allocate credits with our comprehensive team management system.',
      delay: 100,
    },
    {
      icon: featureIcon3,
      title: 'Seamless AI Tool Integration',
      description: 'Interact with various AI tools like CNIC extraction and Emirates ID processing through a clear and straightforward interface.',
      delay: 200,
    },
  ];

  const shapes = [shape1, shape2, shape3, shape4];

  return (
    <section id="features" className="mt-24 md:mt-40 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[120px] items-center">
          <div className="w-full">
            <div className="section-title-top-tag-two mb-5">
              <span>Key Features</span>
            </div>
            <div className="mb-[50px]">
              <h2 className="text-white font-semibold text-24 sm:text-48">
              Efficient AI Tool <br /> Hosting Made Simple
              </h2>
            </div>
            <div className="">
              {features.map((feature, index) => (
                <FeatureItem key={index} {...feature} />
              ))}
            </div>
          </div>
          <div data-aos="fade-left" className="w-full">
            <div className="px-5 py-4 md:px-[74px] md:py-[67px] rounded-[20px] border border-[#231b2f] bg-[#0C022C]">
              <Image 
                src={featureThumb}
                alt="Features" 
                width={500} 
                height={300} 
                layout="responsive" 
                className="rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
      {shapes.map((shape, index) => (
        <div key={index} className={`shape-${index + 1} absolute z-10 ${index % 2 === 0 ? 'left-40' : 'right-96'} ${index < 2 ? 'top-96' : 'top-[550px]'}`}>
          <Image src={shape} alt="" width={20} height={20} />
        </div>
      ))}
    </section>
  );
};

export default Features;