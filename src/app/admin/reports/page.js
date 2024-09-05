// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Reports from '@/components/Dashboard/Reports';

const TeamPage = () => {
  return (
    <Layout>
      <AppBar />
      <Reports />
    </Layout>
  );
};

export default TeamPage;
