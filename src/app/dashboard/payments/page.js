// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Payments from '@/components/Dashboard/Payments';
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard';


const PaymentsPage = () => {
  return (
    <Layout>
      <ProtectedDashboard>
      <AppBar />
      <Payments/>
      </ProtectedDashboard>
    </Layout>
  );
};

export default PaymentsPage;
