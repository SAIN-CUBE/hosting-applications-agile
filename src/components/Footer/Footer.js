import Image from 'next/image';
import Link from 'next/link';

// Import images
import footerLogo from '@/assets/images/home-four/logo.webp';
import shape1 from '@/assets/images/home-four/shape-1.webp';
import shape2 from '@/assets/images/home-four/shape-2.webp';
import shape3 from '@/assets/images/home-four/shape-3.webp';
import shape4 from '@/assets/images/home-four/shape-4.webp';
import ctaImg from '@/assets/images/home-four/cta-img.webp';
import ctaBox from '@/assets/images/home-four/cta-box.svg';
import dotImg from '@/assets/images/home-four/dot-img.webp';

const Footer = () => {
    const services = [
        "AI Tool Access",
        "Credit Management",
        "Team Management",
        "Subscription Plans",
        "CNIC Extraction",
        "Emirates ID Processing"
    ];

    const socialIcons = [
        { name: 'facebook', path: "M10.6667 0H8.55556C5.79413 0 3.55556 2.23857 3.55556 5V6.22222H0V9.77778H3.55556V16H7.11111V9.77778H10.6667V6.22222H7.11111V4.55556C7.11111 4.00327 7.55883 3.55556 8.11111 3.55556H10.6667V0Z" },
        { name: 'twitter', path: "M12.7642 0C10.5722 0 8.7953 1.86585 8.7953 4.1675C8.7953 4.5153 8.83587 4.85315 8.91232 5.17611C6.80469 5.17611 3.63013 4.74999 0.978868 2.09376C0.626315 1.74054 -0.0237835 1.9767 0.000670803 2.47516C0.393588 10.484 3.82353 12.8202 5.58986 12.9656C4.44926 14.0921 2.79242 14.9813 1.1252 15.3804C0.685191 15.4857 0.576494 15.9674 1.00675 16.1073C2.19973 16.4953 3.90729 16.6448 4.82642 16.67C11.3286 16.67 16.6134 11.1972 16.731 4.3991C17.5847 3.84394 18.1315 2.63855 18.4388 1.78464C18.5136 1.57667 18.1728 1.33436 17.9687 1.41931C17.331 1.68479 16.5214 1.74773 15.8318 1.52302C15.1039 0.593104 14 0 12.7642 0Z" },
        { name: 'instagram', path: "M5 0C2.23858 0 0 2.23858 0 5V11.33C0 14.0914 2.23858 16.33 5 16.33H11.33C14.0914 16.33 16.33 14.0914 16.33 11.33V5C16.33 2.23858 14.0914 0 11.33 0H5ZM13.0645 4.08222C13.5155 4.08222 13.881 3.71666 13.881 3.26572C13.881 2.81478 13.5155 2.44922 13.0645 2.44922C12.6136 2.44922 12.248 2.81478 12.248 3.26572C12.248 3.71666 12.6136 4.08222 13.0645 4.08222ZM12.247 8.16551C12.247 10.4202 10.4192 12.248 8.16453 12.248C5.90983 12.248 4.08203 10.4202 4.08203 8.16551C4.08203 5.91081 5.90983 4.08301 8.16453 4.08301C10.4192 4.08301 12.247 5.91081 12.247 8.16551ZM8.16532 10.6138C9.51814 10.6138 10.6148 9.51717 10.6148 8.16434C10.6148 6.81152 9.51814 5.71484 8.16532 5.71484C6.8125 5.71484 5.71582 6.81152 5.71582 8.16434C5.71582 9.51717 6.8125 10.6138 8.16532 10.6138Z" },
        { name: 'dribble', path: "M0.0787061 9.30823C0.479084 12.1658 2.35861 14.5492 4.91845 15.6594C5.03048 13.3562 5.50604 11.1434 6.2916 9.07041C5.45422 8.9105 4.5871 8.82648 3.69861 8.82648C2.44115 8.82648 1.22661 8.99477 0.0787061 9.30823ZM6.12757 16.0739C6.77863 16.2411 7.46109 16.33 8.1643 16.33C10.5078 16.33 12.6208 15.3427 14.1098 13.7613C12.4845 11.6965 10.1761 10.1288 7.49338 9.35723C6.67698 11.4629 6.2012 13.7215 6.12757 16.0739ZM14.8969 12.7858C15.8005 11.4718 16.3293 9.88016 16.3293 8.165C16.3293 8.02119 16.3256 7.87824 16.3182 7.73626C15.4488 7.89372 14.5515 7.97608 13.6344 7.97608C11.8389 7.97608 10.12 7.66043 8.53731 7.0839C8.33792 7.4571 8.14977 7.83648 7.97327 8.22164C10.7455 9.0492 13.1519 10.6609 14.8969 12.7858ZM16.1634 6.51947C15.7389 4.44499 14.5277 2.65708 12.8551 1.48108C11.4192 2.82433 10.1729 4.34473 9.15604 6.00404C10.5505 6.48713 12.0589 6.75133 13.6344 6.75133C14.5004 6.75133 15.346 6.67152 16.1634 6.51947ZM11.7599 0.832253C10.675 0.299297 9.4546 0 8.1643 0C6.27362 0 4.53304 0.642623 3.14905 1.72136C4.39853 3.34118 6.06515 4.66232 8.00312 5.54348C9.03743 3.81982 10.3032 2.23688 11.7599 0.832253ZM2.23946 2.54684C0.87291 3.98751 0.0262453 5.92618 -6.43421e-05 8.06238C1.1797 7.76185 2.41982 7.60173 3.69861 7.60173C4.7518 7.60173 5.77866 7.71034 6.76712 7.91649C6.96395 7.47512 7.17512 7.04087 7.40007 6.61427C5.35434 5.66603 3.58482 4.26501 2.23946 2.54684Z" }
    ];

    return (
        <footer className="relative w-full overflow-hidden" id="footer">
            {/* Shapes */}
            {[shape1, shape2, shape3, shape4].map((shape, index) => (
                <div key={index} className={`shape-${index + 1} absolute ${index % 2 === 0 ? 'left' : 'right'}-${index < 2 ? '40' : '96'} top-${index < 2 ? '96' : '[550px]'} z-10`}>
                    <Image src={shape} alt="" />
                </div>
            ))}

            {/* Circular backgrounds */}
            {['-left-[204px] top-[148px]', '-right-[204px] -bottom-5'].map((position, index) => (
                <div key={index} className={`bg-circle_color w-[408px] h-[408px] rounded-full absolute ${position}`}></div>
            ))}

            {/* CTA Section */}
            <section className="py-16 md:py-[130px]">
                <div className="max-w-6xl w-full mx-auto px-4">
                    <div className="grid grid-cols-6 gap-5 md:grid-cols-10 h4-cta-bg rounded-xl py-10 md:py-[70px] px-5 md:px-[110px] relative">
                        <div className="col-span-6 relative z-10">
                            <div className="px-5 py-0.5 font-medium text-white rounded-[30px] border border-white/10 mb-5 w-fit bg-main-gray/5">
                                <span>Explore AI-Powered Solutions</span>
                            </div>
                            <div className="mb-6">
                                <h2 className="text-white font-semibold text-24 sm:text-48 max-w-[449px]">
                                    Streamline Your Workflow with Our Hosting Application for AI Tools
                                </h2>
                            </div>
                            <p className="text-18 text-white mb-10">
                                No credit card required, access to multiple AI tools
                            </p>
                            <Link href="/pricing" className="group w-fit bg-white px-10 h-[56px] flex justify-center items-center gap-2.5 rounded-[40px] relative price_button_bg before:inline-block before:absolute before:w-full before:h-full before:scale-x-0 hover:before:scale-x-100 overflow-hidden before:transition-transform before:ease-out before:duration-300 before:origin-right hover:before:origin-left before:z-0">
                                <span className="font-inter font-semibold text-purple relative z-10 group-hover:text-white transition-all duration-300">
                                    Start Free Trial
                                </span>
                                <svg
                                    className="relative z-10"
                                    width="7"
                                    height="12"
                                    viewBox="0 0 7 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        className="group-hover:stroke-white transition-all duration-300"
                                        d="M1 10.5L4.79289 6.70711C5.12623 6.37377 5.29289 6.20711 5.29289 6C5.29289 5.79289 5.12623 5.62623 4.79289 5.29289L1 1.5"
                                        stroke="#794AFF"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Link>
                        </div>
                        <div id="home-four-cta-mouse-move" className="col-span-4 flex justify-center items-center relative">
                            <div data-depth="0.80" className="layer relative z-10">
                                <img
                                    data-aos="zoom-in"
                                    data-aos-delay="100"
                                    src={ctaImg.src}
                                    alt=""
                                />
                            </div>
                            <div data-depth="0.20" className="layer absolute -right-10 z-0">
                                <img src={ctaBox.src} alt="" />
                            </div>
                        </div>
                        <img
                            src={dotImg.src}
                            alt=""
                            className="absolute bottom-0 left-0 z-0"
                        />
                    </div>
                </div>
            </section>

            {/* Footer Content */}
            <section className="bg-ai-soft">
                <div className="max-w-6xl mx-auto flex gap-5 flex-wrap justify-between mb-20 px-4">
                    {/* Logo and Social Links */}
                    <div className="w-fit max-w-[300px]">
                        <Image src={footerLogo} alt="logo" width={180} height={120}/>
                        <p className="max-w-[300px] text-white my-6">
                            Agile AI provides a cutting-edge hosting application for AI tools, empowering businesses with efficient credit management and user access control.
                        </p>
                        <div className="flex gap-[15px]">
                            {socialIcons.map((icon, index) => (
                                <a
                                    key={index}
                                    href="#"
                                    aria-label={icon.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-[46px] h-[46px] rounded-full flex justify-center items-center border border-white/10 overflow-hidden relative before:inline-block before:absolute before:z-0 before:w-full before:h-full h4_social_bg before:scale-x-0 group hover:before:scale-x-100 before:origin-right hover:before:origin-left before:transition-transform before:ease-out before:duration-300"
                                >
                                    <span className="relative z-10">
                                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d={icon.path} fill="white" />
                                        </svg>
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div className="w-fit max-w-[300px]">
                        <div className="flex flex-col items-center">
                            <div>
                                <h1 className="font-semibold text-18 text-white">Services</h1>
                                <ul className="mt-3.5">
                                    {services.map((service, index) => (
                                        <li key={index} className="mb-2">
                                            <Link href="/project-details" className="flex gap-2 items-center relative group font-medium text-white/50 hover:text-white hover:underline transition-all duration-300 overflow-hidden">
                                                <svg className="absolute -left-2 transition-all duration-300 group-hover:left-0" width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 1L5 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="group-hover:translate-x-4 transition-all duration-300">{service}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="w-fit max-w-[300px]">
                        <div className="max-w-[223px]">
                            <h1 className="font-semibold text-18 text-white">Address</h1>
                            <div className="flex gap-2 items-center relative group font-medium text-white/50 hover:text-white hover:underline transition-all duration-300 mt-3.5">
                                <span className="transition-all duration-300">
                                     Your Adress Here
                                </span>
                            </div>
                            <h1 className="font-semibold text-18 text-white mt-6">Contact</h1>
                            <div className="flex gap-2 items-center relative group font-medium text-white/50 hover:text-white hover:underline transition-all duration-300 mt-3.5">
                                <span className="transition-all duration-300">
                                    <a href="mailto:info@example.com">info@example.com</a>
                                    <br />
                                    +1111111111111
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="w-fit max-w-[300px]">
                        <h1 className="font-semibold text-18 text-white">Newsletter</h1>
                        <p className="transition-all duration-300 text-white/50 pt-3.5">
                            Subscribe newsletter to get updates
                        </p>
                        <input
                            type="email"
                            id="eFour"
                            placeholder="Email Address"
                            className="border border-white/10 py-2.5 px-6 rounded-[28px] focus:outline-none w-full mt-5 text-white bg-main-gray/5"
                        />
                        <Link href="#" className="home-two-btn-bg py-3.5 group h4_contact_bg border-transparent w-fit mt-2.5 inline-block">
                            <span className="text-base text-white group-hover:text-purple transition-all duration-300 font-semibold font-inter relative z-10">
                                Contact US
                            </span>
                            <svg
                                className="relative z-10 inline-block ml-2"
                                width="7"
                                height="12"
                                viewBox="0 0 7 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    className="group-hover:stroke-purple transition-all duration-300"
                                    d="M1.10254 10.5L4.89543 6.70711C5.22877 6.37377 5.39543 6.20711 5.39543 6C5.39543 5.79289 5.22877 5.62623 4.89543 5.29289L1.10254 1.5"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Copyright */}
                <div className="w-full h-[80px] md:h-[65px] bg-[#160E24] px-4">
                    <div className="max-w-6xl mx-auto h-full">
                        <div className="w-full h-full flex flex-wrap justify-between items-center">
                            <span className="text-white/50 max-w-80">
                                2024 © All rights reserved by
                                <b className="text-white ml-2">Agile AI</b>
                            </span>
                            <div className="relative w-full sm:w-fit flex justify-center">
                                <a
                                    aria-label="go-top"
                                    href="#"
                                    className="w-[45px] h-[45px] rounded-full border-[3px] border-buisness-light-black flex justify-center items-center bg-purple absolute -top-20 sm:-top-[55px]"
                                >
                                    <span>
                                        <svg
                                            width="13"
                                            height="18"
                                            viewBox="0 0 13 18"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M1 6.33333L6.33333 1M6.33333 1L11.6667 6.33333M6.33333 1V17"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </a>
                            </div>
                            <ul className="flex max-w-80 space-x-3 md:space-x-6 items-center">
                                <li className="hover:text-white hover:underline common-transition text-paragraph font-medium">
                                    <Link href="#">Privacy Policy</Link>
                                </li>
                                <li className="text-paragraph font-medium">|</li>
                                <li className="hover:text-white hover:underline common-transition text-paragraph font-medium">
                                    <Link href="#">Terms & Conditions</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </footer>
    );
};

export default Footer;