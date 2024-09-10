// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Subscription from '@/components/Dashboard/Subscription';
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard';


const SubscriptionPage = () => {
  return (
    <Layout>
      <ProtectedDashboard>
      <AppBar />
      <Subscription />
      </ProtectedDashboard>
    </Layout>
  );
};

export default SubscriptionPage;
