// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import SubscriptionManagement from '@/components/Dashboard/Subscription';
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard';


const SubscriptionPage = () => {
  return (
    <Layout>
      <ProtectedDashboard>
      <AppBar />
      <SubscriptionManagement />
      </ProtectedDashboard>
    </Layout>
  );
};

export default SubscriptionPage;
