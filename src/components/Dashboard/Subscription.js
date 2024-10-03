"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const SubscriptionManagement = () => {
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('/api/subscriptions');
      setSubscriptionPlans(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const PlanCard = ({ plan }) => {
    const isCurrentPlan = plan.plan_name === "Basic"; // Assume Basic is the current plan
    const isRecommended = plan.plan_name === "Pro"; // Assume Pro is the recommended plan

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5 }}
        className={`bg-gray-800 p-6 rounded-lg shadow-lg transform transition-transform duration-500 hover:shadow-xl flex flex-col justify-between relative`}
      >
        {isRecommended && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-black px-2 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
            Recommended
          </div>
        )}
        <div className={`bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 rounded-t-lg -mt-6 -mx-6 mb-4`}>
          <h2 className="text-2xl font-semibold">{plan.plan_name}</h2>
          <p className="text-4xl font-bold mt-2">${plan.price}<span className="text-base font-normal">/{plan.duration.toLowerCase()}</span></p>
        </div>
        <p className="text-lg font-semibold mb-4 text-gray-300">{plan.credit_limit} Credits</p>
        <ul className="mb-6 space-y-2">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center text-gray-300">
              <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button className={`w-full py-2 rounded-lg font-semibold transition duration-300 ${
          isCurrentPlan
            ? 'bg-gray-600 text-white cursor-default'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}>
          {isCurrentPlan ? 'Your Current Plan' : isRecommended ? 'Recommended' : 'Upgrade Your Plan'}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Subscription Plans</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {subscriptionPlans.map((plan) => (
            <PlanCard key={plan.plan_name} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionManagement;