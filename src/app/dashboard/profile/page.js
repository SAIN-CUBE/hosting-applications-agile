"use client";
import React, { useState, useEffect } from 'react';
import Layout from '@/app/dashboard/layout';
import AppBar from '@/components/Dashboard/AppBar';
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard';
import { motion } from 'framer-motion';
import { UserCircleIcon, CreditCardIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';




const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const api = axios.create({
    baseURL: '/api',
  });


  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, creditsResponse] = await Promise.all([
          api.get('/user/details/'),
          api.get('/credits/')
        ]);
        setUser(userResponse.data);
        setCredits(creditsResponse.data.credits);
        setTransactions(creditsResponse.data.transactions);
        setFormData({
          first_name: userResponse.data.first_name,
          last_name: userResponse.data.last_name,
          email: userResponse.data.email,
          phone_number: userResponse.data.phone_number,
          sid: userResponse.data.sid,
        });
        setLoading(false);
      } catch (err) {
        toast.error('Failed to fetch user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/user/update/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.sid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <Layout>
      <ProtectedDashboard>
        <AppBar />
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8 lg:pl-10">
          <h1 className="text-3xl font-bold mb-6">User Profile</h1>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800 rounded-lg shadow-lg p-4"
              >
                <nav className="space-y-2">
                  {['profile', 'credits'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800 rounded-lg shadow-lg p-6"
              >
                {activeTab === 'profile' && (
                  <>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <UserCircleIcon className="h-6 w-6 mr-2" />
                      User Information
                    </h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1" htmlFor="first_name">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            className="w-full bg-gray-700 text-white rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" htmlFor="last_name">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            className="w-full bg-gray-700 text-white rounded px-3 py-2"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="email">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          readOnly
                          className="w-full bg-gray-700 text-white rounded px-3 py-2"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-medium mb-1" htmlFor="sid">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="sid"
                            name="sid"
                            value={formData.sid}
                            readOnly
                            className="w-full bg-gray-700 text-white rounded px-3 py-2 pr-10"
                          />
                          <button
                            onClick={copyToClipboard}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                            title="Copy to clipboard"
                          >
                            {copied ? (
                              <ClipboardDocumentCheckIcon className="h-5 w-5" />
                            ) : (
                              <ClipboardDocumentIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="phone_number">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone_number"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          className="w-full bg-gray-700 text-white rounded px-3 py-2"
                        />
                      </div>
                      <button
                        type="submit"
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Update Profile
                      </button>
                    </form>
                  </>
                )}

                {activeTab === 'credits' && credits && (
                  <>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <CreditCardIcon className="h-6 w-6 mr-2" />
                      Credits
                    </h2>
                    <div className="bg-gray-700 rounded-lg p-6">
                      <p className="text-4xl font-bold mb-2">{credits.remaining}</p>
                      <p className="text-gray-400">Available Credits</p>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-2xl font-semibold mb-1">{credits.total}</p>
                        <p className="text-sm text-gray-400">Total Credits</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-2xl font-semibold mb-1">{credits.used}</p>
                        <p className="text-sm text-gray-400">Used Credits</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mt-6 mb-4">Transaction History</h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      {transactions.length > 0 ? (
                        <ul className="space-y-4">
                          {transactions.map((transaction, index) => (
                            <li key={index} className="border-b border-gray-600 pb-2">
                              <p className="font-semibold">{transaction.description}</p>
                              <p className="text-sm text-gray-400">Amount: {transaction.amount}</p>
                              <p className="text-sm text-gray-400">Date: {new Date(transaction.date).toLocaleString()}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No transactions found.</p>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </ProtectedDashboard>
    </Layout>
  );
};

export default ProfilePage;