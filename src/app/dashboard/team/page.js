// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Team from '@/components/Dashboard/Team';
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard';


const TeamPage = () => {
  return (
    <Layout>
      <ProtectedDashboard>
      <AppBar />
      <Team />
      </ProtectedDashboard>
    </Layout>
  );
};

export default TeamPage;
