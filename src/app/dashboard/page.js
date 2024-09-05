// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  // Correct path
import AppBar from '@/components/Dashboard/AppBar';
import Body from '@/components/Dashboard/Body';
import SubscriptionPage from '@/components/Dashboard/Subscription';

const DashboardPage = () => {
  return (
    <Layout>
      <AppBar />
      <Body/>
    </Layout>
  );
};

export default DashboardPage;
