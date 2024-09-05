"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import logo from "@/assets/images/home-four/logo.webp"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: "#features", text: "Features" },
    { href: "#about", text: "About" },
    { href: "#pricing", text: "Pricing" },
    { href: "#faq", text: "Faq" },
    { href: "#testimonials", text: "Testimonials" },
  ];

  const commonLinkClasses = "text-white font-semibold hover:text-purple transition-all duration-300";
  const navItemClasses = `${commonLinkClasses} home-two-nav-item `;

  return (
    <>
      {/* Desktop Header */}
      <header className={`fixed w-full left-0 top-0 z-20 bg-[#0A0118] hidden lg:block transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''} overflow-hidden`}>
        <div className="mx-auto max-w-6xl relative z-20">
          <div className="flex h-[95px] items-center justify-between">
            <div className="flex items-center space-x-[100px]">
              <Link href="#">
                <Image src={logo} alt="logo" width={150} height={50} />
              </Link>
              <nav>
                <ul className="flex items-center space-x-10">
                  {navItems.map((item) => (
                    <li key={item.href} className="group relative">
                      <Link href={item.href} className={`${navItemClasses} before:content-[attr(data-content)]`} data-content={item.text}>
                        {item.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="flex items-center space-x-[30px]">
              <Link href="/login" className={`${commonLinkClasses} flex items-center space-x-1.5`}>
                <span>Register Now</span>
                <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="group-hover:stroke-purple transition-all duration-300" d="M8.84289 11.625H8.84961M5.09961 11.625H5.10633" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path className="group-hover:stroke-purple transition-all duration-300" d="M1.17547 14.1336C1.34413 15.3862 2.38171 16.3676 3.64435 16.4257C4.70682 16.4745 5.78609 16.5 6.97461 16.5C8.16313 16.5 9.24241 16.4745 10.3049 16.4257C11.5675 16.3676 12.6051 15.3862 12.7738 14.1336C12.8838 13.316 12.9746 12.4782 12.9746 11.625C12.9746 10.7718 12.8838 9.93399 12.7738 9.11644C12.6051 7.86377 11.5675 6.88237 10.3049 6.82432C9.24241 6.77548 8.16313 6.75 6.97461 6.75C5.78609 6.75 4.70681 6.77548 3.64435 6.82432C2.38171 6.88237 1.34413 7.86377 1.17547 9.11644C1.06539 9.93399 0.974609 10.7718 0.974609 11.625C0.974609 12.4782 1.06539 13.316 1.17547 14.1336Z" stroke="currentColor" strokeWidth="1.5" />
                  <path className="group-hover:stroke-purple transition-all duration-300" d="M3.59961 6.75V4.875C3.59961 3.01104 5.11065 1.5 6.97461 1.5C8.83857 1.5 10.3496 3.01104 10.3496 4.875V6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="#" className="home-two-btn-bg py-2.5 px-4 group bg-purple border-purple">
                <span className="text-base text-white group-hover:text-purple transition-all duration-300 font-semibold font-inter relative z-10">
                  Contact US
                </span>
                <svg className="relative z-10 ml-2 inline-block" width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="group-hover:stroke-purple transition-all duration-300" d="M1.10254 10.5L4.89543 6.70711C5.22877 6.37377 5.39543 6.20711 5.39543 6C5.39543 5.79289 5.22877 5.62623 4.89543 5.29289L1.10254 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="header-four-border h-[1px]"></div>
      </header>

      {/* Mobile Header */}
      <header className={`lg:hidden w-full fixed top-0 left-0 z-50 bg-[#0A0118] transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="#" aria-label="logo">
            <Image src={logo} alt="logo" width={120} height={40} />
          </Link>
          <button
            aria-label="mobile-Menu"
            className="text-white w-6 h-6"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <svg className="pointer-events-none transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                <path fill="#ffff" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
              </svg>
            ) : (
              <svg className="pointer-events-none transition-all duration-300 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="24" height="24">
                <path fill="#ffff" d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
              </svg>
            )}
          </button>
        </div>
        <div className={`transition-all duration-300 ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="fixed z-40 h-screen w-full bg-black/80 transition-all duration-300 delay-150"></div>
          <div className="fixed z-50 h-[calc(100vh-4rem)] w-full overflow-y-auto bg-[#0A0118] top-16 transition-all duration-300 delay-0">
            <div className="flex flex-col gap-8 p-5">
              <ul className="flex flex-col gap-5 text-white text-base leading-5 font-medium font-inter">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`${navItemClasses} before:content-[attr(data-content)]`} data-content={item.text} onClick={toggleMenu}>
                      {item.text}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-5">
                <Link href="/login" className="group flex space-x-1.5 items-center text-white hover:text-purple w-fit" onClick={toggleMenu}>
                  <span className="font-semibold">Register Now</span>
                  <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="group-hover:stroke-purple transition-all duration-300" d="M8.84289 11.625H8.84961M5.09961 11.625H5.10633" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path className="group-hover:stroke-purple transition-all duration-300" d="M1.17547 14.1336C1.34413 15.3862 2.38171 16.3676 3.64435 16.4257C4.70682 16.4745 5.78609 16.5 6.97461 16.5C8.16313 16.5 9.24241 16.4745 10.3049 16.4257C11.5675 16.3676 12.6051 15.3862 12.7738 14.1336C12.8838 13.316 12.9746 12.4782 12.9746 11.625C12.9746 10.7718 12.8838 9.93399 12.7738 9.11644C12.6051 7.86377 11.5675 6.88237 10.3049 6.82432C9.24241 6.77548 8.16313 6.75 6.97461 6.75C5.78609 6.75 4.70681 6.77548 3.64435 6.82432C2.38171 6.88237 1.34413 7.86377 1.17547 9.11644C1.06539 9.93399 0.974609 10.7718 0.974609 11.625C0.974609 12.4782 1.06539 13.316 1.17547 14.1336Z" stroke="currentColor" strokeWidth="1.5" />
                    <path className="group-hover:stroke-purple transition-all duration-300" d="M3.59961 6.75V4.875C3.59961 3.01104 5.11065 1.5 6.97461 1.5C8.83857 1.5 10.3496 3.01104 10.3496 4.875V6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="#" className="home-two-btn-bg py-2.5 px-4 group bg-purple border-purple w-fit" onClick={toggleMenu}>
                  <span className="text-base text-white group-hover:text-purple transition-all duration-300 font-semibold font-inter relative z-10">
                    Contact US
                  </span>
                  <svg className="relative z-10 ml-2 inline-block" width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="group-hover:stroke-purple transition-all duration-300" d="M1.10254 10.5L4.89543 6.70711C5.22877 6.37377 5.39543 6.20711 5.39543 6C5.39543 5.79289 5.22877 5.62623 4.89543 5.29289L1.10254 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;