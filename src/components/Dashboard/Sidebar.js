"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  HomeIcon, 
  UserGroupIcon, 
  CreditCardIcon, 
  ComputerDesktopIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CurrencyDollarIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiLogOut } from 'react-icons/fi';

const SidebarItem = React.memo(({ item, isActive, setActiveItem, isCollapsed, textVisible }) => {
  return (
    <Link
      href={item.href}
      onClick={() => setActiveItem(item.href)}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
        ${isActive 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <div className="flex items-center">
        <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-400'}`} />
        {!isCollapsed && (
          <span className={`transition-opacity duration-300 ${textVisible ? 'opacity-100' : 'opacity-0'}`}>
            {item.name}
          </span>
        )}
      </div>
    </Link>
  );
});

SidebarItem.displayName = 'SidebarItem';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState(pathname);
  const sidebarRef = useRef(null);
  const router = useRouter();

  const sidebarItems = [
    { name: 'Dashboard', icon: HomeIcon, href: '/dashboard' },
    { name: 'Team', icon: UserGroupIcon, href: '/dashboard/team' },
    { name: 'AI Tools', icon: ComputerDesktopIcon, href: '/dashboard/ai-tools' },
    { name: 'Payments', icon: CurrencyDollarIcon, href: '/dashboard/payments' },
    { name: 'Subscription', icon: CreditCardIcon, href: '/dashboard/subscription' },
  ];

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
    if (isCollapsed) {
      setTimeout(() => setTextVisible(true), 150);
    } else {
      setTextVisible(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleTransitionEnd = () => {
      if (!isCollapsed) {
        setTextVisible(true);
      }
    };

    const sidebarElement = sidebarRef.current;
    sidebarElement?.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      sidebarElement?.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [isCollapsed]);

  useEffect(() => {
    // Prefetch all routes
    sidebarItems.forEach(item => {
      router.prefetch(item.href);
    });
    router.prefetch('/login'); // Prefetch login page for logout action
  }, [router, sidebarItems]);

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
    <aside 
      ref={sidebarRef}
      className={`fixed inset-y-0 left-0 z-40 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      } transition-all duration-300 ease-in-out bg-gray-900`}
    >
      <div className="flex items-center justify-between h-16 px-4">
        {!isCollapsed ? (
          <div className="flex items-center text-white">
            <Squares2X2Icon className="w-6 h-6 mr-2" />
            <span className={`text-lg font-semibold transition-opacity duration-300 ${textVisible ? 'opacity-100' : 'opacity-0'}`}>
              Dashboard
            </span>
          </div>
        ) : (
          <Squares2X2Icon className="w-8 h-8 text-white" />
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 text-gray-300 hover:text-white focus:outline-none transition-colors duration-200"
        >
          {isCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.name}
            item={item}
            isActive={activeItem === item.href}
            setActiveItem={setActiveItem}
            isCollapsed={isCollapsed}
            textVisible={textVisible}
          />
        ))}
      </nav>
      <div className={`px-4 py-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button onClick={handleLogout} className={`${isCollapsed ? 'p-1.5' : 'w-full px-3 py-1.5'} text-xs font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none transition-colors duration-200`}>
            {isCollapsed ? <FiLogOut className="w-5 h-5" /> : (
              <span className={`transition-opacity duration-300 ${textVisible ? 'opacity-100' : 'opacity-0'}`}>
                Logout
              </span>
            )}
          </button>
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);