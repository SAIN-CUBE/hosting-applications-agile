"use client";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BellIcon,
  ChevronDownIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import logo from "@/assets/images/home-four/logo.webp";

const NavItem = ({ item }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
        isActive
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {item.icon && <item.icon className="mr-2 h-5 w-5" />}
      {item.name}
    </Link>
  );
};

const AppBar = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Projects', href: '/projects', icon: DocumentTextIcon },
    { name: 'Collaborators', href: '/collaborators', icon: UserGroupIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const CreditInfo = () => (
    <div className="flex items-center text-white">
      <CreditCardIcon className="h-6 w-6 text-purple-500 mr-2" />
      <span className="text-sm font-medium">700/1000 Credits</span>
    </div>
  );

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          refresh_token: localStorage.getItem('refreshToken'),
        }),
      });
  
      if (response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation Items */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image width={140} height={60} src={logo} alt="Agile AI Logo" />
            </div>
          </div>

          {/* Credit Information, Notification and Profile Section */}
          <div className="hidden sm:flex sm:items-center space-x-4">
            <CreditInfo />

            <button className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="ml-3 relative">
              <button
                className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <img
                  className="h-8 w-8 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User"
                />
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              </button>
              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Your Profile
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Settings
                  </Link>
                  <button onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden md:hidden lg:hidden">
            <button
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-8">
              <div className="flex-shrink-0">
                <img className="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">Tom Cook</div>
                <div className="text-sm font-medium leading-none text-gray-400">tom@example.com</div>
              </div>
            </div>
            <div className="mt-3 px-8 pt-2 space-y-1">
              <div className='pl-2 pt-2 pb-2'>
              <CreditInfo />
              </div>
              <Link href="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
                Your Profile
              </Link>
              <Link href="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
                Settings
              </Link>
              <div onClick={handleLogout} className="mx-auto px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
                Log out
              </div>              
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AppBar;