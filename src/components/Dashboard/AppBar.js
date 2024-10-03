"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  BellIcon,
  ChevronDownIcon,
  CreditCardIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import logo from "@/assets/images/home-four/logo.svg";

const AppBar = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchCredits = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const api = axios.create({
        baseURL: '/api',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const creditsResponse = await api.get('/credits/');
      setCredits(creditsResponse.data.credits);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching credits:', error);
      setError('Unable to fetch credits. Please try again later.');
      // Don't update credits if there's an error
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      setIsAuthenticated(!!accessToken && !!refreshToken);
      setIsLoading(false);
    };

    checkAuth();

    const fetchUserData = async () => {
      if (!isAuthenticated) return;

      try {
        const api = axios.create({
          baseURL: '/api',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        const [userResponse, creditsResponse] = await Promise.all([
          api.get('/user/details/'),
          api.get('/credits/')
        ]);

        setUser(userResponse.data);
        setCredits(creditsResponse.data.credits);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Unable to fetch user data. Please try again later.');
        // Don't update user or credits if there's an error
      }
    };

    if (isAuthenticated) {
      fetchUserData();
    }

    // Set up polling for credits only if authenticated
    let intervalId;
    if (isAuthenticated) {
      intervalId = setInterval(fetchCredits, 5000); // Check every 5 seconds
    }

    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchCredits, isAuthenticated]);

  const CreditInfo = () => (
    isAuthenticated ? (
      <div className="flex items-center text-white">
        <CreditCardIcon className="h-6 w-6 text-purple-500 mr-2" />
        <span className="text-sm font-medium">
          {credits ? `${credits.remaining}/${credits.total} Credits` : 'Loading credits...'}
        </span>
      </div>
    ) : null
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
        setIsAuthenticated(false);
        setUser(null);
        setCredits(null);
        router.push('/login');
      } else {
        console.error('Logout failed');
        setError('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setError('An error occurred during logout. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or any loading indicator you prefer
  }

  return (
    <nav className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 pt-2">
            <Image width={130} height={100} src={logo} alt="Agile AI Logo" />
          </div>

          {/* Credit Information, Notification and Profile Section */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <CreditInfo />

            {isAuthenticated && (
              <button className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}

            {isAuthenticated ? (
              <div className="ml-3 relative">
                <button
                  className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <UserCircleIcon className="h-8 w-8 text-gray-300" aria-hidden="true" />
                  <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                </button>
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-white">{user ? `${user.first_name} ${user.last_name}` : 'Loading...'}</p>
                      <p className="text-xs text-gray-300">{user ? user.email : 'Loading...'}</p>
                    </div>
                    <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      Your Profile
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Log in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden">
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
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-10 w-10 text-gray-300" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-white">{user ? `${user.first_name} ${user.last_name}` : 'Loading...'}</div>
                    <div className="text-sm font-medium leading-none text-gray-400">{user ? user.email : 'Loading...'}</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <div className='px-3 py-2'>
                    <CreditInfo />
                  </div>
                  <Link href="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message
      {error && (
        <div className="bg-red-600 text-white px-4 py-2 text-center">
          {error}
        </div>
      )} */}
    </nav>
  );
};

export default AppBar;