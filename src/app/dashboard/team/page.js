// pages/dashboard.js
import React from 'react';
import Layout from '@/app/dashboard/layout';  
import AppBar from '@/components/Dashboard/AppBar';
import Team from '@/components/Dashboard/Team';


const TeamPage = () => {
  return (
    <Layout>
      <AppBar />
      <Team />
    </Layout>
  );
};

export default TeamPage;
