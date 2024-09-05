"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { CreditCardIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Payments = () => {
  const [availableCredits, setAvailableCredits] = useState(750);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [creditUsage, setCreditUsage] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'Visa',
    last4: '1234',
    expiryDate: '12/25'
  });
  const [showCardDetails, setShowCardDetails] = useState(false);

  useEffect(() => {
    // Simulating API calls
    setPurchaseHistory([
      { id: 1, date: '2024-08-20', plan: 'Pro', credits: 5000, amount: 99 },
      { id: 2, date: '2024-07-15', plan: 'Basic', credits: 1000, amount: 29 },
      { id: 3, date: '2024-06-10', plan: 'Free Trial', credits: 100, amount: 0 },
    ]);

    setCreditUsage([650, 720, 800, 750, 900, 1050, 750]);
  }, []);

  const chartData = {
    labels: ['7 days ago', '6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Today'],
    datasets: [
      {
        label: 'Credit Usage',
        data: creditUsage,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Credit Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-semibold mb-4">Available Credits</h2>
            <div className="flex items-center justify-between mb-6">
              <span className="text-6xl font-bold">{availableCredits}</span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CreditCardIcon className="h-20 w-20 text-white opacity-50" />
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Payment Method</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCardDetails(!showCardDetails)}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  {showCardDetails ? (
                    <EyeSlashIcon className="h-6 w-6" />
                  ) : (
                    <EyeIcon className="h-6 w-6" />
                  )}
                </motion.button>
              </div>
              <AnimatePresence>
                {showCardDetails ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-4 shadow-lg"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold">{paymentMethod.type}</span>
                      <CreditCardIcon className="h-8 w-8 text-white opacity-50" />
                    </div>
                    <div className="mb-4">
                      <p className="font-mono text-lg">•••• •••• •••• {paymentMethod.last4}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-200">Card Holder</p>
                        <p className="font-semibold">JOHN DOE</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-200">Expires</p>
                        <p className="font-semibold">{paymentMethod.expiryDate}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-lg font-semibold">•••• {paymentMethod.last4}</p>
                    <p className="text-sm text-gray-300">Click the eye icon to view card details</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gray-800 rounded-2xl p-8 shadow-xl"
          >
            <h2 className="text-2xl font-semibold mb-4">Credit Usage</h2>
            <Line data={chartData} options={chartOptions} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800 rounded-2xl p-8 shadow-xl"
        >
          <h2 className="text-2xl font-semibold mb-4">Purchase History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-right">Credits</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-gray-700">
                    <td className="px-4 py-2">{purchase.date}</td>
                    <td className="px-4 py-2">{purchase.plan}</td>
                    <td className="px-4 py-2 text-right">+{purchase.credits}</td>
                    <td className="px-4 py-2 text-right">${purchase.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Payments;