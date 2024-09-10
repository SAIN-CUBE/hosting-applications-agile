// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import CreditPurchase from '@/components/Dashboard/purchase';
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard';


const PurchasePage = () => {
  return (
    <Layout>
      <ProtectedDashboard>
      <AppBar />
      <CreditPurchase />
      </ProtectedDashboard>
    </Layout>
  );
};

export default PurchasePage;
