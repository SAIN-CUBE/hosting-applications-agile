"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, PlusCircleIcon, PencilIcon, TrashIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const initialSubscriptionPlans = [
  {
    id: 1,
    name: "Free Trial",
    price: "$0",
    credits: 100,
    duration: "14 days",
    features: ["Limited access to AI tools", "Email support", "1 user"],
    color: "from-blue-500 to-blue-700"
  },
  {
    id: 2,
    name: "Basic",
    price: "$29",
    credits: 1000,
    duration: "Monthly",
    features: ["Access to basic AI tools", "Email support", "1 user"],
    color: "from-green-500 to-green-700"
  },
  {
    id: 3,
    name: "Pro",
    price: "$99",
    credits: 5000,
    duration: "Monthly",
    features: ["Access to all AI tools", "Priority support", "5 users", "Advanced analytics"],
    color: "from-purple-500 to-purple-700"
  },
  {
    id: 4,
    name: "Enterprise",
    price: "Custom",
    credits: "Unlimited",
    duration: "Annual",
    features: ["Custom AI solutions", "24/7 dedicated support", "Unlimited users", "Custom integrations"],
    color: "from-pink-500 to-pink-700"
  },
];

const Subscription = () => {
  const [subscriptionPlans, setSubscriptionPlans] = useState(initialSubscriptionPlans);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);

  const handleCreateOrUpdatePlan = (plan) => {
    setSubscriptionPlans(plans => 
      editingPlan
        ? plans.map(p => p.id === editingPlan.id ? {...plan, id: editingPlan.id} : p)
        : [...plans, {...plan, id: Date.now()}]
    );
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = (planId) => {
    setSubscriptionPlans(plans => plans.filter(p => p.id !== planId));
  };

  const PlanCard = ({ plan, isAdmin }) => {
    const isCurrentPlan = plan.name === "Basic"; // Assume Basic is the current plan
    const isRecommended = plan.name === "Pro"; // Assume Pro is the recommended plan

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
        <div className={`bg-gradient-to-r ${plan.color} text-white p-4 rounded-t-lg -mt-6 -mx-6 mb-4`}>
          <h2 className="text-2xl font-semibold">{plan.name}</h2>
          <p className="text-4xl font-bold mt-2">{plan.price}<span className="text-base font-normal">/{plan.duration}</span></p>
        </div>
        <p className="text-lg font-semibold mb-4 text-gray-300">{plan.credits} Credits</p>
        <ul className="mb-6 space-y-2">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center text-gray-300">
              <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link href={`subscription/purchase/`} passHref>
          <button className={`w-full py-2 rounded-lg font-semibold transition duration-300 ${
            isCurrentPlan
              ? 'bg-gray-600 text-white cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
            {isCurrentPlan ? 'Your Current Plan' : isRecommended ? 'Recommended' : 'Upgrade Your Plan'}
          </button>
        </Link>
        {isAdmin && (
          <div className="mt-4 flex justify-end space-x-2">
            <button onClick={() => {setEditingPlan(plan); setShowModal(true);}} className="p-2 bg-yellow-600 rounded-full hover:bg-yellow-700 transition duration-300">
              <PencilIcon className="h-4 w-4 text-white" />
            </button>
            <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition duration-300">
              <TrashIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  const PlanForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState(initialData || {
      name: '', price: '', credits: '', duration: '', features: [], color: 'from-blue-500 to-blue-700'
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeatureChange = (e, index) => {
      const newFeatures = [...formData.features];
      newFeatures[index] = e.target.value;
      setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Package Name" className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" required />
        <input name="price" value={formData.price} onChange={handleChange} placeholder="Price" className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" required />
        <input name="credits" value={formData.credits} onChange={handleChange} placeholder="Credits" className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" required />
        <input name="duration" value={formData.duration} onChange={handleChange} placeholder="Duration" className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" required />
        <select name="color" value={formData.color} onChange={handleChange} className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white">
          <option value="from-blue-500 to-blue-700">Blue</option>
          <option value="from-green-500 to-green-700">Green</option>
          <option value="from-purple-500 to-purple-700">Purple</option>
          <option value="from-pink-500 to-pink-700">Pink</option>
        </select>
        {formData.features.map((feature, index) => (
          <div key={index} className="flex">
            <input
              value={feature}
              onChange={(e) => handleFeatureChange(e, index)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
              placeholder={`Feature ${index + 1}`}
              required
            />
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }))} className="ml-2 bg-red-600 text-white px-3 rounded-lg hover:bg-red-700 transition duration-300">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300">
          Add Feature
        </button>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => {setShowModal(false); setEditingPlan(null);}} className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
            Cancel
          </button>
          <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300">
            {editingPlan ? 'Update Package' : 'Create Package'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="bg-gray-900 text-white px-3 sm:px-5 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Subscription Plans</h1>
          <button
            onClick={() => setIsAdminView(!isAdminView)}
            className="bg-gray-800 text-white py-2 px-4 rounded-lg flex items-center hover:bg-gray-700 transition duration-300"
          >
            <UserIcon className="h-5 w-5 mr-2" />
            {isAdminView ? "User View" : "Admin View"}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {subscriptionPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isAdmin={isAdminView} />
          ))}
        </div>

        {isAdminView && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-yellow-400" />
              <span>Admin Tools</span>
            </h2>
            <button
              onClick={() => {setEditingPlan(null); setShowModal(true);}}
              className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Create New Package
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-semibold mb-4">
                {editingPlan ? 'Edit Package' : 'Create New Package'}
              </h2>
              <PlanForm 
                onSubmit={handleCreateOrUpdatePlan}
                initialData={editingPlan}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subscription;