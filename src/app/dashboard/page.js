// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  // Correct path
import AppBar from '@/components/Dashboard/AppBar';
import Body from '@/components/Dashboard/Body';
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard';

const DashboardPage = () => {
  return (
    <Layout>
      <ProtectedDashboard>
      <AppBar />
      <Body/>
      </ProtectedDashboard>
    </Layout>
  );
};

export default DashboardPage;
