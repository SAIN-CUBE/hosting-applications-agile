// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Payments from '@/components/Dashboard/Payments';


const PaymentsPage = () => {
  return (
    <Layout>
      <AppBar />
      <Payments/>
    </Layout>
  );
};

export default PaymentsPage;
