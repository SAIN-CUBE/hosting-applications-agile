// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Subscription from '@/components/Dashboard/Subscription';


const SubscriptionPage = () => {
  return (
    <Layout>
      <AppBar />
      <Subscription />
    </Layout>
  );
};

export default SubscriptionPage;
