// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import CreditPurchase from '@/components/Dashboard/purchase';


const PurchasePage = () => {
  return (
    <Layout>
      <AppBar />
      <CreditPurchase />
    </Layout>
  );
};

export default PurchasePage;
