// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Admin from '@/components/Dashboard/Admin';

const TeamPage = () => {
  return (
    <Layout>
      <AppBar />
      <Admin/>
    </Layout>
  );
};

export default TeamPage;
