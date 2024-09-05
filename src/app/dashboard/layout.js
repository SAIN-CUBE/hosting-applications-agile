// components/Layout.js
import React from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-colbg-gray-900">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pl-6 sm:pl-6 pt-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
